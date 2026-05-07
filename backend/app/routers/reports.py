from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import Optional
import os
import uuid
import json
from .. import schemas, models
from ..database import get_db
from ..services.roboflow_service import analyze_pothole_image
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
    
    # 2. Call Roboflow Service
    detection = await analyze_pothole_image(file_path)
    
    # 3. Create Report record (Mock ID generation)
    report_id = f"rep-{uuid.uuid4().hex[:8]}"
    db_report = models.CitizenReport(
        id=report_id,
        citizen_id=citizenId,
        lat=lat,
        lon=lon,
        description=description,
        image_url=image_url,
        
        # Original fields mapped
        ai_status=models.AIStatus("PENDING"),  # Kept for backwards compatibility if needed
        ai_confidence=detection["aiConfidence"],
        ai_reason="AI Classified",
        bbox=json.dumps(detection["bbox"]) if detection["bbox"] else None,
        
        # New AI fields
        ai_classification=detection["aiClassification"],
        prediction_count=detection["predictionCount"],
        detection_model="pothole-voxrl/1",
        detection_timestamp=datetime.utcnow(),
        detection_status="COMPLETED" if detection["detected"] else "NO_DETECTION",
        province=None,  # Or parse from lat/lon if required later
        
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
    
    let_status = db_report.ai_status.value
    if db_report.ai_classification == 'VERIFIED_POTHOLE':
        let_status = 'ACCEPTED'
    elif db_report.ai_classification == 'NEEDS_MANUAL_REVIEW':
        let_status = 'PENDING'
    elif db_report.ai_classification == 'REJECTED':
        let_status = 'REJECTED'

    # Convert back for pydantic
    response_data = {
        "id": db_report.id,
        "citizenId": db_report.citizen_id,
        "lat": db_report.lat,
        "lon": db_report.lon,
        "description": db_report.description,
        "imageUrl": db_report.image_url,
        "aiStatus": let_status,
        "aiConfidence": db_report.ai_confidence,
        "aiReason": db_report.ai_reason,
        "bbox": json.loads(db_report.bbox) if db_report.bbox else None,
        "aiClassification": db_report.ai_classification,
        "predictionCount": db_report.prediction_count,
        "detectionModel": db_report.detection_model,
        "detectionTimestamp": db_report.detection_timestamp,
        "detectionStatus": db_report.detection_status,
        "province": db_report.province,
        "status": db_report.status,
        "createdAt": db_report.created_at
    }
    
    return response_data

@router.get("", response_model=list[schemas.ReportResponse])
def get_reports(db: Session = Depends(get_db)):
    reports = db.query(models.CitizenReport).all()
    result = []
    for db_report in reports:
        let_status = db_report.ai_status.value
        if db_report.ai_classification == 'VERIFIED_POTHOLE':
            let_status = 'ACCEPTED'
        elif db_report.ai_classification == 'NEEDS_MANUAL_REVIEW':
            let_status = 'PENDING'
        elif db_report.ai_classification == 'REJECTED':
            let_status = 'REJECTED'
            
        result.append({
            "id": db_report.id,
            "citizenId": db_report.citizen_id,
            "lat": db_report.lat,
            "lon": db_report.lon,
            "description": db_report.description,
            "imageUrl": db_report.image_url,
            "aiStatus": let_status,
            "aiConfidence": db_report.ai_confidence,
            "aiReason": db_report.ai_reason,
            "bbox": json.loads(db_report.bbox) if db_report.bbox else None,
            "aiClassification": db_report.ai_classification,
            "predictionCount": db_report.prediction_count,
            "detectionModel": db_report.detection_model,
            "detectionTimestamp": db_report.detection_timestamp,
            "detectionStatus": db_report.detection_status,
            "province": db_report.province,
            "status": db_report.status,
            "createdAt": db_report.created_at
        })
    return result
