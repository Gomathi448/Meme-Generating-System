from pydantic import BaseModel
from typing import Optional, List, Dict
from datetime import datetime

class AICaptionRequest(BaseModel):
    prompt: str
    tone: str = "sarcastic" # sarcastic, wholesome, dark, corporate
    language: str = "en"
    template_name: Optional[str] = None

class CaptionVariant(BaseModel):
    top_text: str
    bottom_text: str
    sentiment_score: float
    humor_score: float
    virality_score: float
    explanation: Optional[str] = None

class AICaptionResponse(BaseModel):
    prompt: str
    tone: str
    variants: List[CaptionVariant]

class VisionCaptionRequest(BaseModel):
    image_data_url: str

class VisionCaptionResponse(BaseModel):
    description: str
    suggested_captions: List[CaptionVariant]

class ModelVersionSwap(BaseModel):
    model_version: str

class PromptLogFeedback(BaseModel):
    feedback: int # 1 = Thumbs Up, -1 = Thumbs Down, 0 = Neutral

class PromptLogOut(BaseModel):
    id: int
    user_id: Optional[int] = None
    username: Optional[str] = "Anonymous"
    prompt_text: str
    generated_caption: str
    model_version: str
    latency_ms: int
    feedback: int
    cost: float
    created_at: datetime

    class Config:
        from_attributes = True

class CostTrackerOut(BaseModel):
    total_cost: float
    total_generations: int
    avg_latency_ms: float
    api_success_rate: float
