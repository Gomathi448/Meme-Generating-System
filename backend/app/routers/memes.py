import os
import time
from typing import List, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.user import User
from app.models.template import Template
from app.models.meme import Meme
from app.models.interaction import Like, Comment, AIUsage, PromptLog, AuditLog
from app.schemas.meme import MemeOut, MemeCreate, CommentOut, CommentCreate
from app.schemas.ai import AICaptionRequest, AICaptionResponse, CaptionVariant, VisionCaptionRequest, VisionCaptionResponse
from app.routers.auth import get_current_user
from app.services.ai_service import ai_service
from app.services.image_service import image_service
from app.core.sockets import manager

router = APIRouter(prefix="/memes", tags=["memes"])

@router.post("/generate-captions", response_model=AICaptionResponse)
def generate_captions(
    req: AICaptionRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Check quota
    quota = db.query(AIUsage).filter(AIUsage.user_id == current_user.id).first()
    if quota and quota.count_used >= quota.count_limit:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="AI quota limit exceeded. Contact admin to increase quota."
        )
        
    start_time = time.time()
    
    # Generate variations
    try:
        variants = ai_service.generate_caption_variants(
            prompt=req.prompt,
            tone=req.tone,
            language=req.language,
            template_name=req.template_name
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"NLP caption engine failed: {str(e)}")
        
    latency_ms = int((time.time() - start_time) * 1000)
    
    # Log prompt usage & cost
    if variants:
        best_caption = f"{variants[0]['top_text']} | {variants[0]['bottom_text']}"
        log = PromptLog(
            user_id=current_user.id,
            prompt_text=req.prompt,
            generated_caption=best_caption,
            model_version=ai_service.active_model,
            latency_ms=latency_ms,
            feedback=0,
            cost=0.002
        )
        db.add(log)
        
        # Increment quota usage
        if quota:
            quota.count_used += 1
            
        db.commit()
        
    return {
        "prompt": req.prompt,
        "tone": req.tone,
        "variants": variants
    }

@router.post("/analyze-upload", response_model=VisionCaptionResponse)
def analyze_upload(
    req: VisionCaptionRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Check quota
    quota = db.query(AIUsage).filter(AIUsage.user_id == current_user.id).first()
    if quota and quota.count_used >= quota.count_limit:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="AI quota limit exceeded."
        )
        
    try:
        vision_result = ai_service.suggest_vision_captions(req.image_data_url)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Vision captioning model failed: {str(e)}")
        
    # Track as standard usage
    if quota:
        quota.count_used += 1
        
    # Log audit
    audit = AuditLog(
        user_id=current_user.id,
        action="VISION_CAPTION_IMAGE",
        target_table="memes",
        details=f"Analyzed upload: {vision_result['description'][:50]}"
    )
    db.add(audit)
    db.commit()
    
    return vision_result

@router.post("/generate", response_model=MemeOut)
async def generate_meme_image(
    req: MemeCreate,
    image_data_url: Optional[str] = None, # passed if user uploaded a custom image base64
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    base_img = None
    template = None
    
    # 1. Acquire base image
    if image_data_url:
        try:
            base_img = image_service.decode_base64_image(image_data_url)
        except Exception:
            raise HTTPException(status_code=400, detail="Invalid custom image data format")
    elif req.template_id:
        template = db.query(Template).filter(Template.id == req.template_id).first()
        if not template:
            raise HTTPException(status_code=404, detail="Template not found")
        # Load local template
        try:
            # Reconstruct local path from serving path
            filename = os.path.basename(template.image_url)
            filepath = os.path.join(image_service.templates_dir, filename)
            from PIL import Image
            base_img = Image.open(filepath)
        except Exception:
            raise HTTPException(status_code=500, detail="Could not load template file")
    else:
        raise HTTPException(status_code=400, detail="Must provide either a template_id or custom image_data_url")

    # 2. Render text overlay
    try:
        # Overlay captions onto base image
        meme_url = image_service.generate_meme(
            base_image=base_img,
            top_text=req.top_text,
            bottom_text=req.bottom_text,
            template_name=template.name if template else None
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to render meme overlay: {str(e)}")

    # 3. Calculate scores
    sentiment = ai_service.analyze_sentiment(req.top_text + " " + req.bottom_text)
    # humor logic
    humor = min(100.0, max(10.0, 75.0 + len(req.top_text + req.bottom_text) % 20 + sentiment * 5.0))
    virality = min(100.0, max(10.0, humor + (10.0 if req.tone == "sarcastic" else -5.0)))
    
    # 4. Save to Database
    new_meme = Meme(
        creator_id=current_user.id,
        template_id=template.id if template else None,
        title=req.title,
        image_url=meme_url,
        top_text=req.top_text,
        bottom_text=req.bottom_text,
        tone=req.tone,
        tags=req.tags,
        sentiment_score=sentiment,
        humor_score=humor,
        virality_score=virality,
        status=req.status.upper(),
        scheduled_for=req.scheduled_for
    )
    db.add(new_meme)
    
    if template:
        template.usage_count += 1
        
    db.commit()
    db.refresh(new_meme)

    # 5. Broadcast real-time feed updates if published
    if new_meme.status == "PUBLISHED":
        await manager.broadcast({
            "type": "NEW_MEME",
            "meme": {
                "id": new_meme.id,
                "title": new_meme.title,
                "creator_username": current_user.username,
                "image_url": new_meme.image_url
            }
        })
        
    return get_meme_by_id_helper(new_meme.id, current_user.id, db)

@router.get("", response_model=List[MemeOut])
def get_meme_feed(
    limit: int = Query(10, ge=1, le=100),
    offset: int = Query(0, ge=0),
    sort: str = "latest", # latest, trending, top_humor
    tone: Optional[str] = None,
    tag: Optional[str] = None,
    creator_id: Optional[int] = None,
    current_user_id: Optional[int] = None, # optional parameter for checking likes
    db: Session = Depends(get_db)
):
    query = db.query(Meme).filter(Meme.status == "PUBLISHED")
    
    if tone:
        query = query.filter(Meme.tone == tone)
    if tag:
        query = query.filter(Meme.tags.like(f"%{tag}%"))
    if creator_id:
        query = query.filter(Meme.creator_id == creator_id)
        
    if sort == "latest":
        query = query.order_by(Meme.created_at.desc())
    elif sort == "trending":
        # Sort by virality_score
        query = query.order_by(Meme.virality_score.desc())
    elif sort == "top_humor":
        query = query.order_by(Meme.humor_score.desc())
        
    memes = query.offset(offset).limit(limit).all()
    
    result = []
    for m in memes:
        result.append(get_meme_by_id_helper(m.id, current_user_id, db))
        
    return result

@router.get("/{id}", response_model=MemeOut)
def get_meme(id: int, current_user_id: Optional[int] = None, db: Session = Depends(get_db)):
    meme = db.query(Meme).filter(Meme.id == id).first()
    if not meme:
        raise HTTPException(status_code=404, detail="Meme not found")
    return get_meme_by_id_helper(meme.id, current_user_id, db)

@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_meme(id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    meme = db.query(Meme).filter(Meme.id == id).first()
    if not meme:
        raise HTTPException(status_code=404, detail="Meme not found")
        
    if meme.creator_id != current_user.id and current_user.role != "ADMIN":
        raise HTTPException(status_code=403, detail="Not authorized to delete this meme")
        
    db.delete(meme)
    db.commit()
    return None

@router.post("/{id}/like")
async def toggle_like(id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    meme = db.query(Meme).filter(Meme.id == id).first()
    if not meme:
        raise HTTPException(status_code=404, detail="Meme not found")
        
    like = db.query(Like).filter(Like.meme_id == id, Like.user_id == current_user.id).first()
    liked = False
    
    if like:
        db.delete(like)
        liked = False
    else:
        new_like = Like(user_id=current_user.id, meme_id=id)
        db.add(new_like)
        liked = True
        
    db.commit()
    
    # Broadcast like change
    likes_count = db.query(Like).filter(Like.meme_id == id).count()
    await manager.broadcast({
        "type": "MEME_LIKE",
        "meme_id": id,
        "likes_count": likes_count
    })
    
    return {"liked": liked, "likes_count": likes_count}

@router.post("/{id}/comment", response_model=CommentOut)
def post_comment(
    id: int,
    req: CommentCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    meme = db.query(Meme).filter(Meme.id == id).first()
    if not meme:
        raise HTTPException(status_code=404, detail="Meme not found")
        
    comment = Comment(
        user_id=current_user.id,
        meme_id=id,
        text=req.text
    )
    db.add(comment)
    db.commit()
    db.refresh(comment)
    
    # Return formatted CommentOut
    return CommentOut(
        id=comment.id,
        user_id=comment.user_id,
        username=current_user.username,
        avatar_url=current_user.avatar_url,
        text=comment.text,
        created_at=comment.created_at
    )

@router.get("/{id}/comments", response_model=List[CommentOut])
def get_comments(id: int, db: Session = Depends(get_db)):
    comments = db.query(Comment).filter(Comment.meme_id == id).order_by(Comment.created_at.desc()).all()
    result = []
    for c in comments:
        user = db.query(User).filter(User.id == c.user_id).first()
        result.append(CommentOut(
            id=c.id,
            user_id=c.user_id,
            username=user.username if user else "Deleted User",
            avatar_url=user.avatar_url if user else None,
            text=c.text,
            created_at=c.created_at
        ))
    return result

# Helper logic to assemble MemeOut
def get_meme_by_id_helper(meme_id: int, current_user_id: Optional[int], db: Session) -> MemeOut:
    meme = db.query(Meme).filter(Meme.id == meme_id).first()
    creator = db.query(User).filter(User.id == meme.creator_id).first()
    
    likes_count = db.query(Like).filter(Like.meme_id == meme_id).count()
    comments_count = db.query(Comment).filter(Comment.meme_id == meme_id).count()
    
    is_liked = False
    if current_user_id:
        is_liked = db.query(Like).filter(Like.meme_id == meme_id, Like.user_id == current_user_id).count() > 0
        
    return MemeOut(
        id=meme.id,
        creator_id=meme.creator_id,
        creator_username=creator.username if creator else "Deleted User",
        creator_avatar=creator.avatar_url if creator else None,
        template_id=meme.template_id,
        title=meme.title,
        image_url=meme.image_url,
        top_text=meme.top_text,
        bottom_text=meme.bottom_text,
        tone=meme.tone,
        tags=meme.tags,
        sentiment_score=meme.sentiment_score,
        humor_score=meme.humor_score,
        virality_score=meme.virality_score,
        status=meme.status,
        scheduled_for=meme.scheduled_for,
        likes_count=likes_count,
        comments_count=comments_count,
        is_liked_by_me=is_liked,
        created_at=meme.created_at
    )
