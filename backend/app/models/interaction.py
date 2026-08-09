from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from app.core.database import Base

class Like(Base):
    __tablename__ = "likes"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    meme_id = Column(Integer, ForeignKey("memes.id", ondelete="CASCADE"), nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    __table_args__ = (UniqueConstraint('user_id', 'meme_id', name='_user_meme_like_uc'),)

    user = relationship("User", back_populates="likes")
    meme = relationship("Meme", back_populates="likes")

class Comment(Base):
    __tablename__ = "comments"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    meme_id = Column(Integer, ForeignKey("memes.id", ondelete="CASCADE"), nullable=False)
    text = Column(String, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    user = relationship("User", back_populates="comments")
    meme = relationship("Meme", back_populates="comments")

class Follow(Base):
    __tablename__ = "follows"
    id = Column(Integer, primary_key=True, index=True)
    follower_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    followed_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    __table_args__ = (UniqueConstraint('follower_id', 'followed_id', name='_follower_followed_uc'),)

class AIUsage(Base):
    __tablename__ = "ai_usages"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    count_limit = Column(Integer, default=50) # generations allowed per day/month
    count_used = Column(Integer, default=0)
    reset_date = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    user = relationship("User", back_populates="ai_quota")

class PromptLog(Base):
    __tablename__ = "prompt_logs"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    prompt_text = Column(String, nullable=False)
    generated_caption = Column(String, nullable=False)
    model_version = Column(String, default="gpt-4o-mini")
    latency_ms = Column(Integer, default=250)
    feedback = Column(Integer, default=0) # 1 for thumbs up, -1 for thumbs down, 0 for neutral
    cost = Column(Float, default=0.001)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    user = relationship("User", back_populates="prompt_logs")

class SystemSetting(Base):
    __tablename__ = "system_settings"
    key = Column(String, primary_key=True, index=True)
    value = Column(String, nullable=False)
    description = Column(String, nullable=True)

class AuditLog(Base):
    __tablename__ = "audit_logs"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    action = Column(String, nullable=False) # e.g. BAN_USER, GENERATE_MEME, UPDATE_SETTINGS
    target_table = Column(String, nullable=True)
    details = Column(String, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
