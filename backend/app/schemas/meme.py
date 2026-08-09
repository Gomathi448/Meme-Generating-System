from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

# Template Schemas
class TemplateBase(BaseModel):
    name: str
    image_url: str
    category: str = "trending"
    tags: str = ""

class TemplateCreate(TemplateBase):
    pass

class TemplateOut(TemplateBase):
    id: int
    usage_count: int
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True

# Comment Schemas
class CommentCreate(BaseModel):
    text: str

class CommentOut(BaseModel):
    id: int
    user_id: int
    username: str
    avatar_url: Optional[str] = None
    text: str
    created_at: datetime

    class Config:
        from_attributes = True

# Meme Schemas
class MemeBase(BaseModel):
    title: str = "Untitled Meme"
    top_text: Optional[str] = ""
    bottom_text: Optional[str] = ""
    tone: str = "sarcastic"
    tags: str = ""
    status: str = "PUBLISHED"
    scheduled_for: Optional[datetime] = None

class MemeCreate(MemeBase):
    template_id: Optional[int] = None

class MemeCreateCustom(MemeBase):
    image_data_url: str  # Base64 data url for direct upload

class MemeUpdate(BaseModel):
    title: Optional[str] = None
    top_text: Optional[str] = None
    bottom_text: Optional[str] = None
    tone: Optional[str] = None
    tags: Optional[str] = None
    status: Optional[str] = None
    scheduled_for: Optional[datetime] = None

class MemeOut(MemeBase):
    id: int
    creator_id: int
    creator_username: str
    creator_avatar: Optional[str] = None
    template_id: Optional[int] = None
    image_url: str
    sentiment_score: float
    humor_score: float
    virality_score: float
    likes_count: int
    comments_count: int
    is_liked_by_me: bool = False
    created_at: datetime

    class Config:
        from_attributes = True
