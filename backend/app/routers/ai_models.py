from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.user import User
from app.models.interaction import PromptLog, AuditLog
from app.schemas.ai import PromptLogOut, ModelVersionSwap, PromptLogFeedback, CostTrackerOut
from app.routers.auth import get_current_user, get_current_admin
from app.services.ai_service import ai_service

router = APIRouter(prefix="/ai-models", tags=["ai-models"])

@router.get("/status", response_model=List[PromptLogOut])
def get_prompt_logs(
    limit: int = 20,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Returns list of recent AI generations, prompt configurations, latency, and costs.
    """
    logs = db.query(PromptLog).order_by(PromptLog.created_at.desc()).limit(limit).all()
    result = []
    for l in logs:
        user = db.query(User).filter(User.id == l.user_id).first()
        result.append(PromptLogOut(
            id=l.id,
            user_id=l.user_id,
            username=user.username if user else "Anonymous",
            prompt_text=l.prompt_text,
            generated_caption=l.generated_caption,
            model_version=l.model_version,
            latency_ms=l.latency_ms,
            feedback=l.feedback,
            cost=l.cost,
            created_at=l.created_at
        ))
    return result

@router.get("/cost-summary", response_model=CostTrackerOut)
def get_cost_tracker(
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Returns total model cost and latency statistics.
    """
    logs = db.query(PromptLog).all()
    total_cost = sum(l.cost for l in logs)
    total_gens = len(logs)
    avg_latency = sum(l.latency_ms for l in logs) / total_gens if total_gens > 0 else 0.0
    
    # Calculate success rate (mocked based on failures rate, e.g. logs with extremely low latency)
    failures = sum(1 for l in logs if l.latency_ms < 5) # extreme simulated failures
    success_rate = (total_gens - failures) / total_gens if total_gens > 0 else 1.0
    
    return {
        "total_cost": round(total_cost, 4),
        "total_generations": total_gens,
        "avg_latency_ms": round(avg_latency, 1),
        "api_success_rate": round(success_rate * 100, 1)
    }

@router.post("/version")
def change_model_version(
    req: ModelVersionSwap,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Changes the active model execution version.
    """
    old_version = ai_service.active_model
    ai_service.set_model_version(req.model_version)
    
    # Log audit
    audit = AuditLog(
        user_id=current_admin.id,
        action="SWAP_AI_MODEL_VERSION",
        details=f"Swapped active model from {old_version} to {req.model_version}"
    )
    db.add(audit)
    db.commit()
    
    return {"status": "success", "active_version": ai_service.active_model}

@router.post("/feedback/{log_id}")
def rate_generation_output(
    log_id: int,
    req: PromptLogFeedback,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Submits a rating on caption output (thumbs up/down) to tune models.
    """
    log = db.query(PromptLog).filter(PromptLog.id == log_id).first()
    if not log:
        raise HTTPException(status_code=404, detail="Prompt log not found")
        
    log.feedback = req.feedback
    db.commit()
    
    return {"status": "success", "feedback": log.feedback}
