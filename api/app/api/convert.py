import time
import os
import json
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, UploadFile, File, Form, Depends, HTTPException, status, Response
from fastapi.responses import PlainTextResponse
from sqlalchemy.orm import Session
from app.core.config import settings
from app.core.security import get_current_user_optional
from app.db.database import get_db
from app.db.models import User, ConversionHistory, SystemConfig
from app.modules.converter.engine import ConversionEngine
import os as _os

router = APIRouter(prefix="/convert", tags=["Converter Engine & Workflow"])

def get_max_upload_size(db: Session) -> int:
    cfg = db.query(SystemConfig).filter(SystemConfig.key == "max_upload_size_mb").first()
    if cfg:
        try:
            return int(cfg.value) * 1024 * 1024
        except ValueError:
            pass
    return settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024

def get_nominal_threshold(db: Session) -> int:
    cfg = db.query(SystemConfig).filter(SystemConfig.key == "nominal_threshold").first()
    if cfg:
        try:
            return int(cfg.value)
        except ValueError:
            pass
    return settings.DEFAULT_NOMINAL_THRESHOLD

@router.post("/detect-format")
async def detect_file_format(
    file: UploadFile = File(...)
):
    # Validate file extension
    ext = _os.path.splitext(file.filename or "")[1].lower()
    if ext and ext not in settings.ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file type '{ext}'. Allowed: {', '.join(sorted(settings.ALLOWED_EXTENSIONS))}"
        )
    content_bytes = await file.read()
    await file.seek(0)
    try:
        content_text = content_bytes.decode("utf-8")
    except UnicodeDecodeError:
        content_text = content_bytes.decode("latin-1", errors="ignore")

    src_format, tgt_format = ConversionEngine.detect_format(file.filename or "file.csv", content_text)
    return {
        "filename": file.filename,
        "source_format": src_format,
        "target_format": tgt_format,
        "file_size_bytes": len(content_bytes)
    }

@router.post("/inspect-schema")
async def inspect_schema(
    file: UploadFile = File(...),
    source_format: Optional[str] = Form(None),
    delimiter: str = Form(","),
    quote_char: str = Form('"'),
    has_header: bool = Form(True),
    db: Session = Depends(get_db)
):
    content_bytes = await file.read()
    max_size = get_max_upload_size(db)
    if len(content_bytes) > max_size:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File exceeds maximum allowed upload size ({max_size // (1024*1024)} MB)."
        )

    try:
        content_text = content_bytes.decode("utf-8")
    except UnicodeDecodeError:
        content_text = content_bytes.decode("latin-1", errors="ignore")

    if not source_format:
        source_format, _ = ConversionEngine.detect_format(file.filename or "file.csv", content_text)

    nominal_thresh = get_nominal_threshold(db)
    inspect_result = ConversionEngine.inspect_file(
        content=content_text,
        source_format=source_format,
        delimiter=delimiter,
        quote_char=quote_char,
        has_header=has_header,
        nominal_threshold=nominal_thresh
    )

    return inspect_result

@router.post("/execute")
async def execute_conversion(
    file: UploadFile = File(...),
    source_format: Optional[str] = Form(None),
    target_format: Optional[str] = Form(None),
    relation_name: Optional[str] = Form(None),
    schema_overrides: Optional[str] = Form(None), # JSON string of attributes list
    delimiter: str = Form(","),
    quote_char: str = Form('"'),
    has_header: bool = Form(True),
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db)
):
    # Validate file extension
    ext = _os.path.splitext(file.filename or "")[1].lower()
    if ext and ext not in settings.ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file type '{ext}'. Allowed: {', '.join(sorted(settings.ALLOWED_EXTENSIONS))}"
        )
    start_time = time.time()
    content_bytes = await file.read()
    file_size = len(content_bytes)

    max_size = get_max_upload_size(db)
    if file_size > max_size:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File size exceeds maximum allowed upload size ({max_size // (1024*1024)} MB)."
        )

    try:
        content_text = content_bytes.decode("utf-8")
    except UnicodeDecodeError:
        content_text = content_bytes.decode("latin-1", errors="ignore")

    # Auto detect if not supplied
    if not source_format or not target_format:
        src, tgt = ConversionEngine.detect_format(file.filename or "file.csv", content_text)
        source_format = source_format or src
        target_format = target_format or tgt

    # Parse overrides if provided
    overridden_attributes = None
    if schema_overrides:
        try:
            overridden_attributes = json.loads(schema_overrides)
        except Exception:
            overridden_attributes = None

    nominal_thresh = get_nominal_threshold(db)

    # Derive default relation name from filename
    if not relation_name or not relation_name.strip():
        base_name = os.path.splitext(file.filename or "dataset")[0]
        relation_name = base_name.replace(" ", "_").lower()

    conv_res = ConversionEngine.execute_conversion(
        content=content_text,
        source_format=source_format,
        target_format=target_format,
        relation_name=relation_name,
        overridden_attributes=overridden_attributes,
        delimiter=delimiter,
        quote_char=quote_char,
        has_header=has_header,
        nominal_threshold=nominal_thresh
    )

    duration_ms = round((time.time() - start_time) * 1000, 2)

    # Prepare target filename
    base_no_ext = os.path.splitext(file.filename or "converted")[0]
    out_ext = f".{target_format.lower()}"
    output_filename = f"{base_no_ext}{out_ext}"

    # Log to ConversionHistory
    history_entry = ConversionHistory(
        user_id=current_user.id if current_user else None,
        file_name=output_filename,
        file_size_bytes=file_size,
        source_format=source_format.upper(),
        target_format=target_format.upper(),
        instance_count=conv_res.get("instance_count", 0),
        attribute_count=conv_res.get("attribute_count", 0),
        status="SUCCESS" if conv_res.get("success") else "FAILED",
        duration_ms=duration_ms,
        converted_content=conv_res.get("converted_output") if conv_res.get("success") else None
    )
    db.add(history_entry)
    db.commit()
    db.refresh(history_entry)

    if not conv_res.get("success"):
        return {
            "success": False,
            "message": "Conversion aborted due to fatal validation errors (FR-014).",
            "history_id": history_entry.id,
            "defects": conv_res.get("defects", []),
            "duration_ms": duration_ms
        }

    return {
        "success": True,
        "message": f"Successfully converted {source_format.upper()} to {target_format.upper()} in {duration_ms}ms.",
        "history_id": history_entry.id,
        "filename": output_filename,
        "instance_count": conv_res["instance_count"],
        "attribute_count": conv_res["attribute_count"],
        "relation_name": conv_res["relation_name"],
        "preview_header": conv_res["preview_header"],
        "full_output": conv_res["converted_output"],
        "defects": conv_res.get("defects", []),
        "duration_ms": duration_ms
    }

@router.get("/download/{history_id}")
def download_converted_file(history_id: int, db: Session = Depends(get_db)):
    record = db.query(ConversionHistory).filter(ConversionHistory.id == history_id).first()
    if not record or not record.converted_content:
        raise HTTPException(status_code=404, detail="Converted file not found.")

    media_type = "text/csv" if record.target_format.lower() == "csv" else "text/plain"
    
    headers = {
        "Content-Disposition": f"attachment; filename=\"{record.file_name}\""
    }
    return Response(
        content=record.converted_content,
        media_type=media_type,
        headers=headers
    )
