import os
from typing import Optional
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "Automated Intelligent Meme Generating System"
    API_V1_STR: str = "/api/v1"
    
    # Security
    SECRET_KEY: str = os.getenv("SECRET_KEY", "SUPER_SECRET_MEME_KEY_2026_NLP_AI_GENERATOR_SYSTEM_PROD")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    
    # Database
    # Standard fallback to local SQLite. If DATABASE_URL is set, it will connect to PostgreSQL.
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./meme_gen.db")
    
    # AI APIs (Optional: triggers fallback mock engine if empty)
    OPENAI_API_KEY: Optional[str] = os.getenv("OPENAI_API_KEY", None)
    CLAUDE_API_KEY: Optional[str] = os.getenv("CLAUDE_API_KEY", None)
    HUGGINGFACE_API_KEY: Optional[str] = os.getenv("HUGGINGFACE_API_KEY", None)
    
    # Image Storage (Optional: triggers local disk mock CDN if empty)
    CLOUDINARY_URL: Optional[str] = os.getenv("CLOUDINARY_URL", None)
    
    class Config:
        case_sensitive = True
        env_file = ".env"

settings = Settings()
