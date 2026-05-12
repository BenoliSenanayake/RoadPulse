from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from sqlalchemy.orm import Session
from typing import Optional, List
import os
import uuid
import logging
from datetime import datetime
from app.database import get_db
from app import schemas, models, crud
from app.config import settings
from app.services.roboflow_service import analyze_pothole_image
from app.services.province_resolver import resolve_province_and_district
from app.security import get_current_user, require_admin, require_staff, require_citizen

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/reports", tags=["reports"])

UPLOAD_DIR = "uploads"

VALID_REPORT_STATUSES = {"New", "Verified", "Scheduled", "In Progress", "Completed", "Rejected"}
STATUS_ALIASES = {
    "new": "New",
    "pending": "New",
    "under review": "New",
    "needs manual review": "New",
    "verified": "Verified",
    "confirmed": "Verified",
    "accepted": "Verified",
    "verified pothole": "Verified",
    "scheduled": "Scheduled",
    "repair scheduled": "Scheduled",
    "scheduled repair": "Scheduled",
    "awaiting crew": "Scheduled",
    "in progress": "In Progress",
    "repair in progress": "In Progress",
    "completed": "Completed",
    "fixed": "Completed",
    "repair completed": "Completed",
    "rejected": "Rejected",
    "discarded": "Rejected",
    "unable to repair": "Rejected",
    "non pothole": "Rejected",
}


def normalize_report_status(value: Optional[str]) -> Optional[str]:
    if value is None:
        return None
    key = str(value).strip().lower().replace("_", " ").replace("-", " ")
    key = " ".join(key.split())
    status = STATUS_ALIASES.get(key)
    if not status:
        raise HTTPException(status_code=400, detail=f"Unsupported report status: {value}")
    if status not in VALID_REPORT_STATUSES:
        raise HTTPException(status_code=400, detail=f"Unsupported report status: {value}")
    return status

@router.post("", response_model=schemas.CitizenReportRead)
async def create_report(
    latitude: float = Form(...),
    longitude: float = Form(...),
    description: Optional[str] = Form(None),
    address: Optional[str] = Form(None),
    image: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_citizen)
):
    logger.info(f"POST /reports called by {current_user.email}")
    resolved_citizen_id = current_user.id
    
    try:
        # ── Save uploaded image ──
        os.makedirs(UPLOAD_DIR, exist_ok=True)
        ext = image.filename.split(".")[-1] if "." in image.filename else "jpg"
        filename = f"{uuid.uuid4()}.{ext}"
        file_path = os.path.join(UPLOAD_DIR, filename)
        
        with open(file_path, "wb") as f:
            content = await image.read()
            f.write(content)
        print(f">>> Image saved: {file_path} ({len(content)} bytes)")
            
        image_url = f"{settings.BACKEND_PUBLIC_URL}/static/{filename}"
        
        # ── AI Analysis (non-blocking — failure must NOT block submission) ──
        classification = "NEEDS_MANUAL_REVIEW"
        detection = {
            "detected": False,
            "aiClassification": "NEEDS_MANUAL_REVIEW",
            "aiConfidence": 0.0,
            "predictionCount": 0,
            "bbox": None,
            "detectionModel": "pothole-voxrl/1"
        }
        
        try:
            print(">>> Calling AI Analysis...")
            detection = await analyze_pothole_image(file_path)
            classification = detection.get("aiClassification", "NEEDS_MANUAL_REVIEW")
            print(f">>> AI Result: {classification} (Conf: {detection.get('aiConfidence')})")
        except Exception as ai_err:
            print(f">>> WARNING: AI analysis failed (non-fatal): {ai_err}")
            print(">>> Proceeding with NEEDS_MANUAL_REVIEW classification")
        
        initial_status = "Verified" if classification == "VERIFIED_POTHOLE" else ("Rejected" if classification == "REJECTED" else "New")
        province, district = resolve_province_and_district(latitude, longitude)
        print(f">>> Detected Geography: {province} / {district}")

        # ── Save CitizenReport to DB ──
        print(">>> DB insert starting...")
        report_in = schemas.CitizenReportCreate(
            citizen_id=resolved_citizen_id,
            latitude=latitude,
            longitude=longitude,
            description=description,
        )
        
        db_report = crud.create_report(
            db=db,
            report=report_in,
            image_url=image_url,
            address=address,
            district=district,
            provincial_council=province,
            status=initial_status,
            ai_classification=classification,
            ai_confidence=detection.get("aiConfidence"),
            prediction_count=detection.get("predictionCount", 0),
            bbox=detection.get("bbox"),
            detection_model=detection.get("detectionModel"),
            detection_timestamp=datetime.utcnow()
        )
        print(f">>> DB commit success. Created ID: {db_report.id}")
        print(f">>> Saved province: {db_report.provincial_council}")
        print(f">>> Saved status: {db_report.status}")
        print(f">>> Saved district: {db_report.district}")
        
        # ── Save DetectionResult (non-blocking) ──
        try:
            crud.create_detection_result(db, detection, db_report.id)
        except Exception as det_err:
            print(f">>> WARNING: Failed to save detection result (non-fatal): {det_err}")
        
        # ── Save AuditLog (non-blocking) ──
        try:
            crud.create_audit_log(
                db=db,
                report_id=db_report.id,
                user_id=resolved_citizen_id,
                action="REPORT_SUBMITTED",
                new_status=initial_status,
                notes=f"Citizen submitted report. AI status: {classification}"
            )
        except Exception as log_err:
            print(f">>> WARNING: Failed to save audit log (non-fatal): {log_err}")
        
        # ── Verification ──
        verified_report = crud.get_report_by_id(db, db_report.id)
        print(f">>> VERIFICATION: Saved report found in DB: {verified_report is not None}")
        
        if not verified_report:
            print("!!! ERROR: Report was committed but not found immediately after !!!")
            raise HTTPException(status_code=500, detail="Database persistence failed. Record not found after commit.")

        # Log total count for debug
        total_count = db.query(models.CitizenReport).count()
        print(f">>> Total reports in DB after insert: {total_count}")
        print("="*50 + "\n")
        return db_report

    except HTTPException:
        raise  # Re-raise HTTP exceptions as-is
    except Exception as e:
        print(f"!!! CRITICAL ERROR in POST /reports: {str(e)}")
        import traceback
        traceback.print_exc()
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to save report: {str(e)}")

@router.get("", response_model=List[schemas.CitizenReportRead])
def get_reports(
    provincialCouncil: Optional[str] = None, 
    citizenId: Optional[str] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    logger.info(f"GET /reports called by User: {current_user.email}, Role: {current_user.role}, UserProvince: {current_user.provincial_council}")
    
    query = db.query(models.CitizenReport)
    
    # Apply role-based filtering
    if current_user.role == "ADMIN":
        # Admin can see all, but can also apply filters
        if provincialCouncil and provincialCouncil not in ['null', 'undefined']:
            query = query.filter(models.CitizenReport.provincial_council == provincialCouncil)
        if citizenId and citizenId not in ['null', 'undefined']:
            query = query.filter(models.CitizenReport.citizen_id == citizenId)
    
    elif current_user.role == "MAINTENANCE_OFFICER":
        # Staff can only see their province
        staff_province = current_user.provincial_council
        if not staff_province:
            logger.warning(f"Staff user {current_user.email} has no assigned province!")
            return [] # Or raise error
        
        query = query.filter(models.CitizenReport.provincial_council == staff_province)
        logger.info(f"Applying provincial isolation for staff: {staff_province}")
        
    elif current_user.role == "CITIZEN":
        # Citizen can only see their own reports
        query = query.filter(models.CitizenReport.citizen_id == current_user.id)
        logger.info(f"Applying citizen isolation for: {current_user.id}")

    # Common status filter
    if status and status not in ['null', 'undefined']:
        query = query.filter(models.CitizenReport.status == normalize_report_status(status))
        
    results = query.order_by(models.CitizenReport.submitted_at.desc()).all()
    logger.info(f"GET /reports returning {len(results)} records for {current_user.role} {current_user.email}")
    return results

@router.get("/history", response_model=List[schemas.AuditLogRead])
def get_reports_history(db: Session = Depends(get_db), current_user: models.User = Depends(require_staff)):
    logger.info(f"GET /history called by {current_user.email} ({current_user.role})")
    
    if current_user.role == "ADMIN":
        return crud.list_audit_logs(db)
    
    # Filter logs by reports that belong to the officer's province
    # This requires a join or subquery in the CRUD or here
    # For now, I'll return all if admin, or filter in logic if needed
    # But usually history is viewed per report in detail view anyway.
    # If this is the "Global" audit log, only Admins should see it.
    
    if current_user.role == "MAINTENANCE_OFFICER":
        # Maintenance officers should probably only see logs related to their province
        # But crud.list_audit_logs doesn't support filtering yet.
        # I'll implement a filtered version or keep it simple for now.
        return db.query(models.AuditLog).join(models.CitizenReport).filter(
            models.CitizenReport.provincial_council == current_user.provincial_council
        ).all()
        
    return crud.list_audit_logs(db)

@router.get("/{report_id}", response_model=schemas.CitizenReportRead)
def get_report(
    report_id: str, 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    report = crud.get_report_by_id(db, report_id)
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
        
    # Authorization check
    if current_user.role == "ADMIN":
        return report
        
    if current_user.role == "MAINTENANCE_OFFICER":
        if report.provincial_council != current_user.provincial_council:
            logger.warning(f"Unauthorized Access: Officer {current_user.email} tried to view report {report_id} from {report.provincial_council}")
            raise HTTPException(status_code=403, detail="Access Restricted: This report is outside your assigned province.")
        return report
        
    if current_user.role == "CITIZEN":
        if report.citizen_id != current_user.id:
            logger.warning(f"Unauthorized Access: Citizen {current_user.email} tried to view report {report_id} owned by {report.citizen_id}")
            raise HTTPException(status_code=403, detail="Access Restricted: You can only view your own reports.")
        return report
        
    return report

@router.patch("/{report_id}/status", response_model=schemas.CitizenReportRead)
def update_status(
    report_id: str, 
    update: schemas.StatusUpdateCreate, 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_staff)
):
    report = crud.get_report_by_id(db, report_id)
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
        
    # Provincial security check for staff
    if current_user.role == "MAINTENANCE_OFFICER":
        if report.provincial_council != current_user.provincial_council:
            logger.warning(f"Access Denied: Officer {current_user.email} ({current_user.provincial_council}) tried to update report {report_id} in {report.provincial_council}")
            raise HTTPException(status_code=403, detail="Access Restricted: This report belongs to another Provincial Council.")

    old_status = report.status
    next_status = normalize_report_status(update.status) if update.status else None
    
    if next_status:
        crud.update_report_status(db, report_id, next_status)
    if update.priority:
        crud.update_report_priority(db, report_id, update.priority)
    if update.notes:
        crud.update_report_notes(db, report_id, update.notes)

    status_update = schemas.StatusUpdateCreate(
        status=next_status or old_status,
        priority=update.priority,
        notes=update.notes
    )
    crud.create_status_update(db, status_update, report_id, current_user.id)
    
    crud.create_audit_log(
        db=db,
        report_id=report_id,
        user_id=current_user.id,
        action="STATUS_UPDATED",
        old_status=old_status,
        new_status=next_status or old_status,
        notes=update.notes
    )
    
    logger.info(f"Report {report_id} status updated by {current_user.role} {current_user.email}")
    return crud.get_report_by_id(db, report_id)

@router.patch("/{report_id}/notes", response_model=schemas.CitizenReportRead)
def update_notes(report_id: str, notes: str, db: Session = Depends(get_db), current_user: models.User = Depends(require_staff)):
    # Add check
    report = crud.get_report_by_id(db, report_id)
    if current_user.role == "MAINTENANCE_OFFICER" and report.provincial_council != current_user.provincial_council:
         raise HTTPException(status_code=403, detail="Access Restricted")
    return crud.update_report_notes(db, report_id, notes)

@router.patch("/{report_id}/priority", response_model=schemas.CitizenReportRead)
def update_priority(report_id: str, priority: str, db: Session = Depends(get_db), current_user: models.User = Depends(require_staff)):
    # Add check
    report = crud.get_report_by_id(db, report_id)
    if current_user.role == "MAINTENANCE_OFFICER" and report.provincial_council != current_user.provincial_council:
         raise HTTPException(status_code=403, detail="Access Restricted")
    return crud.update_report_priority(db, report_id, priority)

@router.patch("/{report_id}", response_model=schemas.CitizenReportRead)
def update_report(
    report_id: str, 
    updates: dict, 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_staff)
):
    logger.info(f"PATCH /reports/{report_id} called by {current_user.email}")
    report = crud.get_report_by_id(db, report_id)
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    
    # Provincial security check for staff
    if current_user.role == "MAINTENANCE_OFFICER":
        if report.provincial_council != current_user.provincial_council:
            logger.warning(f"Access Denied: Officer {current_user.email} tried to update report {report_id}")
            raise HTTPException(status_code=403, detail="Access Restricted: This report belongs to another Provincial Council.")

    old_status = report.status
    old_priority = report.priority
    
    # Map frontend camelCase to backend snake_case
    mapping = {
        "provincialCouncil": "provincial_council",
        "district": "district",
        "status": "status",
        "priority": "priority",
        "maintenanceNotes": "maintenance_notes"
    }
    
    changed_fields = []
    for key, value in updates.items():
        db_key = mapping.get(key, key)
        if hasattr(report, db_key):
            if db_key == "status":
                value = normalize_report_status(value)
            old_val = getattr(report, db_key)
            if old_val != value:
                setattr(report, db_key, value)
                changed_fields.append(db_key)
            
    if not changed_fields:
        return report

    db.commit()
    db.refresh(report)
    
    # Create Audit Log for significant changes
    if "status" in changed_fields or "priority" in changed_fields or "provincial_council" in changed_fields:
        action = "REPORT_UPDATED"
        if "status" in changed_fields:
            action = "STATUS_CHANGED"
        
        notes = f"Updated fields: {', '.join(changed_fields)}"
        if updates.get("maintenanceNotes"):
            notes += f". Note: {updates.get('maintenanceNotes')}"

        crud.create_audit_log(
            db=db,
            report_id=report_id,
            user_id=current_user.id,
            action=action,
            old_status=old_status,
            new_status=report.status,
            notes=notes
        )
    
    return report
