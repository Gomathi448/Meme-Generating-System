import os
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.template import Template
from app.schemas.meme import TemplateOut, TemplateCreate
from app.routers.auth import get_current_user, get_current_admin
from app.models.user import User
from app.services.image_service import image_service

router = APIRouter(prefix="/templates", tags=["templates"])

@router.get("", response_model=List[TemplateOut])
def get_templates(category: Optional[str] = None, db: Session = Depends(get_db)):
    # Auto-seed if templates table is empty or outdated
    initials = image_service.create_initial_templates()
    count = db.query(Template).count()
    if count < len(initials):
        # Clear old templates and seed the complete set of 30
        db.query(Template).delete()
        for item in initials:
            new_temp = Template(
                name=item["name"],
                image_url=item["url"],
                category="trending",
                tags="funny,meme," + item["name"].lower().replace(" ", "")
            )
            db.add(new_temp)
        db.commit()

    query = db.query(Template).filter(Template.is_active == True)
    if category:
        query = query.filter(Template.category == category)
        
    return query.order_by(Template.usage_count.desc()).all()


@router.post("/upload", response_model=TemplateOut, status_code=status.HTTP_201_CREATED)
async def upload_template(
    name: str = Form(...),
    category: str = Form("trending"),
    tags: str = Form(""),
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Ensure name uniqueness
    existing = db.query(Template).filter(Template.name == name).first()
    if existing:
        raise HTTPException(status_code=400, detail="Template with this name already exists")
        
    # Read file and write to disk
    import uuid
    file_ext = file.filename.split(".")[-1]
    if file_ext.lower() not in ["png", "jpg", "jpeg", "webp"]:
        raise HTTPException(status_code=400, detail="Invalid image extension. Only PNG, JPG, JPEG, WEBP are allowed")
        
    filename = f"template_{uuid.uuid4().hex}.{file_ext}"
    filepath = os.path.join(image_service.templates_dir, filename)
    
    with open(filepath, "wb") as buffer:
        content = await file.read()
        buffer.write(content)
        
    new_template = Template(
        name=name,
        image_url=f"/static/templates/{filename}",
        category=category,
        tags=tags
    )
    db.add(new_template)
    db.commit()
    db.refresh(new_template)
    
    return new_template
