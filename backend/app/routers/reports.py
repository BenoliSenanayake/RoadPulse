from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import Optional, List
import os
import uuid
from datetime import datetime
from app.database import get_db
from app import schemas, models, crud
from app.services.roboflow_service import analyze_pothole_image

router = APIRouter(prefix="/reports", tags=["reports"])

UPLOAD_DIR = "uploads"

# Helper for resolving province roughly based on lat/lon
def detect_province(lat: float, lon: float):
    # In real world, use reverse geocoding API. Stubbed here.
    if lat > 7.5: return "North Central Province"
    elif lat < 6.5: return "Southern Province"
    return "Western Province"

@router.post("", response_model=schemas.CitizenReportRead)
async def create_report(
    citizen_id: str = Form(...),
    latitude: float = Form(...),
    longitude: float = Form(...),
    description: Optional[str] = Form(None),
    address: Optional[str] = Form(None),
    image: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    os.makedirs(UPLOAD_DIR, exist_ok=True)
    ext = image.filename.split(".")[-1] if "." in image.filename else "jpg"
    filename = f"{uuid.uuid4()}.{ext}"
    file_path = os.path.join(UPLOAD_DIR, filename)
    
    with open(file_path, "wb") as f:
        content = await image.read()
        f.write(content)
        
    image_url = f"http://localhost:8000/static/{filename}"
    
    # Analyze Image via Roboflow
    detection = await analyze_pothole_image(file_path)
    
    # Classifications
    classification = detection.get("aiClassification", "NEEDS_MANUAL_REVIEW")
    initial_status = "Verified" if classification == "VERIFIED_POTHOLE" else ("Rejected" if classification == "REJECTED" else "New")

    # Save CitizenReport
    report_in = schemas.CitizenReportCreate(
        citizen_id=citizen_id,
        latitude=latitude,
        longitude=longitude,
        description=description,
    )
    
    db_report = crud.create_report(
        db=db,
        report=report_in,
        image_url=image_url,
        address=address,
        district="Colombo", # Mock district
        provincial_council=detect_province(latitude, longitude),
        status=initial_status,
        ai_classification=classification,
        ai_confidence=detection.get("aiConfidence"),
        prediction_count=detection.get("predictionCount", 0),
        bbox=detection.get("bbox"),
        detection_model=detection.get("detectionModel"),
        detection_timestamp=datetime.utcnow()
    )
    
    # Save DetectionResult
    crud.create_detection_result(db, detection, db_report.id)
    
    # Save AuditLog
    crud.create_audit_log(
        db=db,
        report_id=db_report.id,
        user_id=citizen_id,
        action="REPORT_SUBMITTED",
        new_status=initial_status,
        notes="Citizen submitted a new report"
    )
    
    return db_report

@router.get("", response_model=List[schemas.CitizenReportRead])
def get_reports(province: Optional[str] = None, db: Session = Depends(get_db)):
    if province:
        return crud.list_reports_by_province(db, province)
    return crud.list_reports(db)

@router.get("/history", response_model=List[schemas.AuditLogRead])
def get_reports_history(db: Session = Depends(get_db)):
    return crud.list_audit_logs(db)

@router.get("/{report_id}", response_model=schemas.CitizenReportRead)
def get_report(report_id: str, db: Session = Depends(get_db)):
    report = crud.get_report_by_id(db, report_id)
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    return report

@router.patch("/{report_id}/status", response_model=schemas.CitizenReportRead)
def update_status(report_id: str, update: schemas.StatusUpdateCreate, officer_id: str = "sys-admin", db: Session = Depends(get_db)):
    report = crud.get_report_by_id(db, report_id)
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
        
    old_status = report.status
    crud.update_report_status(db, report_id, update.status)
    if update.priority:
        crud.update_report_priority(db, report_id, update.priority)
        
    crud.create_status_update(db, update, report_id, officer_id)
    
    crud.create_audit_log(
        db=db,
        report_id=report_id,
        user_id=officer_id,
        action="STATUS_UPDATED",
        old_status=old_status,
        new_status=update.status,
        notes=update.notes
    )
    
    return crud.get_report_by_id(db, report_id)

@router.patch("/{report_id}/notes", response_model=schemas.CitizenReportRead)
def update_notes(report_id: str, notes: str, db: Session = Depends(get_db)):
    return crud.update_report_notes(db, report_id, notes)

@router.patch("/{report_id}/priority", response_model=schemas.CitizenReportRead)
def update_priority(report_id: str, priority: str, db: Session = Depends(get_db)):
    return crud.update_report_priority(db, report_id, priority)
