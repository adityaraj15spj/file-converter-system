from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.db.database import get_db
from app.db.models import User, ConversionHistory, SystemConfig
from app.core.security import get_current_admin
from app.core.config import settings

router = APIRouter(prefix="/admin", tags=["Administrative Dashboard"])

class ConfigUpdateRequest(BaseModel):
    max_upload_size_mb: Optional[int] = None
    nominal_threshold: Optional[int] = None

@router.get("/stats")
def get_system_stats(
    admin_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    total_users = db.query(func.count(User.id)).scalar() or 0
    active_users = db.query(func.count(User.id)).filter(User.is_active == True).scalar() or 0
    total_conversions = db.query(func.count(ConversionHistory.id)).scalar() or 0
    successful_conversions = db.query(func.count(ConversionHistory.id)).filter(ConversionHistory.status == "SUCCESS").scalar() or 0
    failed_conversions = db.query(func.count(ConversionHistory.id)).filter(ConversionHistory.status == "FAILED").scalar() or 0

    csv_to_arff = db.query(func.count(ConversionHistory.id)).filter(
        ConversionHistory.source_format == "CSV", ConversionHistory.target_format == "ARFF"
    ).scalar() or 0

    arff_to_csv = db.query(func.count(ConversionHistory.id)).filter(
        ConversionHistory.source_format == "ARFF", ConversionHistory.target_format == "CSV"
    ).scalar() or 0

    # Get current config
    max_upload_cfg = db.query(SystemConfig).filter(SystemConfig.key == "max_upload_size_mb").first()
    nominal_cfg = db.query(SystemConfig).filter(SystemConfig.key == "nominal_threshold").first()

    return {
        "users": {
            "total": total_users,
            "active": active_users,
            "suspended": total_users - active_users
        },
        "conversions": {
            "total": total_conversions,
            "successful": successful_conversions,
            "failed": failed_conversions,
            "success_rate": round((successful_conversions / total_conversions * 100), 1) if total_conversions > 0 else 100.0,
            "csv_to_arff": csv_to_arff,
            "arff_to_csv": arff_to_csv
        },
        "config": {
            "max_upload_size_mb": int(max_upload_cfg.value) if max_upload_cfg else settings.MAX_UPLOAD_SIZE_MB,
            "nominal_threshold": int(nominal_cfg.value) if nominal_cfg else settings.DEFAULT_NOMINAL_THRESHOLD
        }
    }

@router.get("/users")
def list_users(
    admin_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    users = db.query(User).order_by(User.id).all()
    result = []
    for u in users:
        conv_count = db.query(func.count(ConversionHistory.id)).filter(ConversionHistory.user_id == u.id).scalar() or 0
        result.append({
            "id": u.id,
            "email": u.email,
            "full_name": u.full_name,
            "role": u.role,
            "is_active": u.is_active,
            "is_admin": u.is_admin,
            "conversions_count": conv_count,
            "created_at": u.created_at.isoformat() if u.created_at else None,
            "last_login": u.last_login.isoformat() if u.last_login else None
        })
    return result

@router.post("/users/{user_id}/toggle-status")
def toggle_user_status(
    user_id: int,
    admin_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    if user_id == admin_user.id:
        raise HTTPException(status_code=400, detail="Administrators cannot suspend their own account.")
    
    target_user = db.query(User).filter(User.id == user_id).first()
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found.")

    target_user.is_active = not target_user.is_active
    db.commit()
    status_str = "activated" if target_user.is_active else "suspended"
    return {"success": True, "message": f"User account {target_user.email} has been {status_str}."}

@router.post("/config")
def update_system_config(
    payload: ConfigUpdateRequest,
    admin_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    if payload.max_upload_size_mb is not None:
        cfg = db.query(SystemConfig).filter(SystemConfig.key == "max_upload_size_mb").first()
        if not cfg:
            cfg = SystemConfig(key="max_upload_size_mb", value=str(payload.max_upload_size_mb), description="Max upload size in MB")
            db.add(cfg)
        else:
            cfg.value = str(payload.max_upload_size_mb)

    if payload.nominal_threshold is not None:
        cfg = db.query(SystemConfig).filter(SystemConfig.key == "nominal_threshold").first()
        if not cfg:
            cfg = SystemConfig(key="nominal_threshold", value=str(payload.nominal_threshold), description="Distinct threshold for nominal inference")
            db.add(cfg)
        else:
            cfg.value = str(payload.nominal_threshold)

    db.commit()
    return {"success": True, "message": "System configuration updated successfully."}
