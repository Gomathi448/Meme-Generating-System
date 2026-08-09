from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from app.core.database import Base

class Meme(Base):
    __tablename__ = "memes"

    id = Column(Integer, primary_key=True, index=True)
    creator_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    template_id = Column(Integer, ForeignKey("templates.id", ondelete="SET NULL"), nullable=True)
    
    title = Column(String, default="Untitled Meme")
    image_url = Column(String, nullable=False)
    top_text = Column(String, default="")
    bottom_text = Column(String, default="")
    tone = Column(String, default="sarcastic") # sarcastic, wholesome, dark, corporate
    tags = Column(String, default="") # comma-separated tags
    
    # NLP metrics
    sentiment_score = Column(Float, default=0.0) # -1.0 to 1.0
    humor_score = Column(Float, default=0.0) # 0.0 to 100.0
    virality_score = Column(Float, default=0.0) # 0.0 to 100.0
    
    status = Column(String, default="PUBLISHED") # DRAFT, PUBLISHED, SCHEDULED
    scheduled_for = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    # Relationships
    creator = relationship("User", back_populates="memes")
    template = relationship("Template", back_populates="memes")
    likes = relationship("Like", back_populates="meme", cascade="all, delete-orphan")
    comments = relationship("Comment", back_populates="meme", cascade="all, delete-orphan")
