from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import desc
from app.db.database import get_db
from app.db.models import ConversionHistory, User
from app.core.security import get_current_user_optional, get_current_user

router = APIRouter(prefix="/history", tags=["Conversion History"])

@router.get("")
def get_conversion_history(
    limit: int = 50,
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db)
):
    query = db.query(ConversionHistory)
    if current_user and not current_user.is_admin:
        # Show records for user plus any unassigned recent guest runs
        query = query.filter((ConversionHistory.user_id == current_user.id) | (ConversionHistory.user_id == None))
    
    records = query.order_by(desc(ConversionHistory.created_at)).limit(limit).all()

    return [
        {
            "id": r.id,
            "file_name": r.file_name,
            "file_size_bytes": r.file_size_bytes,
            "source_format": r.source_format,
            "target_format": r.target_format,
            "instance_count": r.instance_count,
            "attribute_count": r.attribute_count,
            "status": r.status,
            "duration_ms": r.duration_ms,
            "created_at": r.created_at.isoformat() if r.created_at else None
        }
        for r in records
    ]

@router.delete("/{history_id}")
def delete_history_entry(history_id: int, db: Session = Depends(get_db)):
    record = db.query(ConversionHistory).filter(ConversionHistory.id == history_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="History record not found.")

    db.delete(record)
    db.commit()
    return {"success": True, "message": "History record deleted successfully."}

@router.delete("")
def clear_all_history(db: Session = Depends(get_db)):
    db.query(ConversionHistory).delete()
    db.commit()
    return {"success": True, "message": "All history records cleared."}
