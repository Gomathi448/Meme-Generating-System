from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.user import User
from app.models.meme import Meme
from app.models.interaction import Follow, Like, AuditLog
from app.schemas.user import UserOut, UserFollowStats, UserUpdate
from app.routers.auth import get_current_user, get_current_admin

router = APIRouter(prefix="/users", tags=["users"])

@router.get("/list", response_model=List[UserOut])
def list_users(
    search: Optional[str] = None,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    query = db.query(User)
    if search:
        query = query.filter(User.username.like(f"%{search}%") | User.email.like(f"%{search}%"))
    return query.all()

@router.post("/{id}/ban", response_model=UserOut)
def toggle_ban(
    id: int,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    if id == current_admin.id:
        raise HTTPException(status_code=400, detail="Cannot ban yourself")
        
    user = db.query(User).filter(User.id == id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    user.is_active = not user.is_active
    
    # Log audit
    audit = AuditLog(
        user_id=current_admin.id,
        action="BAN_USER" if not user.is_active else "UNBAN_USER",
        target_table="users",
        details=f"Toggled ban status of user: {user.username} (active={user.is_active})"
    )
    db.add(audit)
    db.commit()
    db.refresh(user)
    
    return user

@router.post("/{id}/role", response_model=UserOut)
def update_user_role(
    id: int,
    req: UserUpdate,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.id == id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    if req.role and req.role.upper() in ["USER", "ADMIN"]:
        user.role = req.role.upper()
        
    db.commit()
    db.refresh(user)
    
    # Log audit
    audit = AuditLog(
        user_id=current_admin.id,
        action="UPDATE_USER_ROLE",
        target_table="users",
        details=f"Updated role of {user.username} to {user.role}"
    )
    db.add(audit)
    db.commit()
    
    return user

@router.get("/profile/{username}", response_model=dict)
def get_user_profile(
    username: str,
    current_user: Optional[User] = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.username == username).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    # Get stats
    followers = db.query(Follow).filter(Follow.followed_id == user.id).count()
    following = db.query(Follow).filter(Follow.follower_id == user.id).count()
    
    is_following = False
    if current_user:
        is_following = db.query(Follow).filter(
            Follow.follower_id == current_user.id,
            Follow.followed_id == user.id
        ).count() > 0
        
    # Total likes on their memes
    user_memes = db.query(Meme).filter(Meme.creator_id == user.id).all()
    user_meme_ids = [m.id for m in user_memes]
    total_likes = db.query(Like).filter(Like.meme_id.in_(user_meme_ids)).count() if user_meme_ids else 0
    
    return {
        "id": user.id,
        "username": user.username,
        "email": user.email,
        "avatar_url": user.avatar_url,
        "role": user.role,
        "created_at": user.created_at,
        "followers_count": followers,
        "following_count": following,
        "is_following": is_following,
        "total_memes_count": len(user_memes),
        "total_likes_received": total_likes
    }

@router.post("/profile/{username}/follow")
def follow_user(
    username: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.username == username).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    if user.id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot follow yourself")
        
    follow = db.query(Follow).filter(
        Follow.follower_id == current_user.id,
        Follow.followed_id == user.id
    ).first()
    
    is_following = False
    if follow:
        db.delete(follow)
        is_following = False
    else:
        new_follow = Follow(follower_id=current_user.id, followed_id=user.id)
        db.add(new_follow)
        is_following = True
        
    db.commit()
    
    # Return count
    followers = db.query(Follow).filter(Follow.followed_id == user.id).count()
    return {"is_following": is_following, "followers_count": followers}
