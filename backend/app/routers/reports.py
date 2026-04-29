from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import Optional
import os
import uuid
import json
from .. import schemas, models
from ..database import get_db
from ..services.ai_service import simulate_yolo_detection
from datetime import datetime

router = APIRouter(prefix="/reports", tags=["reports"])

UPLOAD_DIR = "uploads"

@router.post("", response_model=schemas.ReportResponse)
async def create_report(
    citizenId: str = Form(...),
    lat: float = Form(...),
    lon: float = Form(...),
    description: Optional[str] = Form(None),
    image: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    # 1. Save Image
    os.makedirs(UPLOAD_DIR, exist_ok=True)
    ext = image.filename.split(".")[-1]
    filename = f"{uuid.uuid4()}.{ext}"
    file_path = os.path.join(UPLOAD_DIR, filename)
    
    with open(file_path, "wb") as f:
        content = await image.read()
        f.write(content)
        
    image_url = f"http://localhost:8000/static/{filename}"
    
    # 2. Call AI Service placeholder
    detection = simulate_yolo_detection(file_path)
    
    # 3. Create Report record (Mock ID generation)
    report_id = f"rep-{uuid.uuid4().hex[:8]}"
    db_report = models.CitizenReport(
        id=report_id,
        citizen_id=citizenId,
        lat=lat,
        lon=lon,
        description=description,
        image_url=image_url,
        ai_status=models.AIStatus(detection["aiStatus"]),
        ai_confidence=detection["confidence"],
        ai_reason=detection["message"],
        bbox=json.dumps(detection["bbox"]) if detection["bbox"] else None,
        status="New"
    )
    db.add(db_report)
    
    # Create Audit Log
    log_id = f"log-{uuid.uuid4().hex[:8]}"
    db_log = models.AuditLog(
        id=log_id,
        entity_id=report_id,
        entity_type="REPORT",
        action="SUBMITTED",
        actor="CITIZEN",
        actor_name=citizenId,
        details="Citizen submitted a new report"
    )
    db.add(db_log)
    
    db.commit()
    db.refresh(db_report)
    
    # Convert back for pydantic
    response_data = {
        "id": db_report.id,
        "citizenId": db_report.citizen_id,
        "lat": db_report.lat,
        "lon": db_report.lon,
        "description": db_report.description,
        "imageUrl": db_report.image_url,
        "aiStatus": db_report.ai_status.value,
        "aiConfidence": db_report.ai_confidence,
        "aiReason": db_report.ai_reason,
        "bbox": json.loads(db_report.bbox) if db_report.bbox else None,
        "status": db_report.status,
        "createdAt": db_report.created_at
    }
    
    return response_data

@router.get("", response_model=list[schemas.ReportResponse])
def get_reports(db: Session = Depends(get_db)):
    reports = db.query(models.CitizenReport).all()
    # For now returning empty array as a valid response
    return []
