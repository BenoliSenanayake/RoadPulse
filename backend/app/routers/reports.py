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

@router.get("", response_model=schemas.PaginatedReportResponse)
def get_reports(
    page: int = 1,
    limit: int = 10,
    provincialCouncil: Optional[str] = None, 
    citizenId: Optional[str] = None,
    status: Optional[str] = None,
    category: Optional[str] = None,
    district: Optional[str] = None,
    priority: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    logger.info(f"GET /reports (paginated) called. Category: {category}, Status: {status}, Page: {page}")
    
    query = db.query(models.CitizenReport)
    
    # ── Role-Based Jurisdictional Filtering ──
    if current_user.role == "ADMIN":
        if provincialCouncil and provincialCouncil not in ['null', 'undefined', 'All']:
            query = query.filter(models.CitizenReport.provincial_council == provincialCouncil)
    elif current_user.role == "MAINTENANCE_OFFICER":
        if not current_user.provincial_council:
            return {"data": [], "total": 0, "page": page, "limit": limit, "total_pages": 0}
        query = query.filter(models.CitizenReport.provincial_council == current_user.provincial_council)
    elif current_user.role == "CITIZEN":
        query = query.filter(models.CitizenReport.citizen_id == current_user.id)

    # ── Category Filtering ──
    if category and category != 'all':
        if category == 'verified':
            query = query.filter(models.CitizenReport.status == 'Verified')
        elif category == 'manual-review':
            # Matches frontend isManualReviewReport
            query = query.filter(
                (models.CitizenReport.status == 'New') | 
                (models.CitizenReport.ai_classification == 'NEEDS_MANUAL_REVIEW')
            )
        elif category == 'scheduled':
            query = query.filter(models.CitizenReport.status == 'Scheduled')
        elif category == 'in-progress':
            query = query.filter(models.CitizenReport.status == 'In Progress')
        elif category == 'completed':
            query = query.filter(models.CitizenReport.status == 'Completed')
        elif category == 'rejected':
            query = query.filter(models.CitizenReport.status == 'Rejected')
        elif category == 'overdue':
            # Hardcoded 14 days for now to match staffReportFilters.ts
            from datetime import timedelta
            cutoff = datetime.utcnow() - timedelta(days=14)
            query = query.filter(
                models.CitizenReport.status.in_(['New', 'Verified', 'Scheduled']),
                models.CitizenReport.submitted_at < cutoff
            )

    # ── Field Filtering ──
    if status and status not in ['null', 'undefined', 'All']:
        try:
            normalized = normalize_report_status(status)
            query = query.filter(models.CitizenReport.status == normalized)
        except HTTPException: pass
            
    if district and district not in ['null', 'undefined', 'All']:
        query = query.filter(models.CitizenReport.district == district)
        
    if priority and priority not in ['null', 'undefined', 'All']:
        query = query.filter(models.CitizenReport.priority == priority)
        
    if search:
        search_filter = f"%{search}%"
        query = query.filter(
            (models.CitizenReport.id.ilike(search_filter)) |
            (models.CitizenReport.district.ilike(search_filter)) |
            (models.CitizenReport.description.ilike(search_filter))
        )
        
    # ── Execution ──
    total = query.count()
    total_pages = (total + limit - 1) // limit if limit > 0 else 0
    
    results = query.order_by(models.CitizenReport.submitted_at.desc()) \
                  .offset((page - 1) * limit) \
                  .limit(limit) \
                  .all()
                  
    return {
        "data": results,
        "total": total,
        "page": page,
        "limit": limit,
        "total_pages": total_pages
    }
@router.get("/stats/provinces")
def get_province_stats(db: Session = Depends(get_db), current_user: models.User = Depends(require_admin)):
    """Returns report counts grouped by province."""
    from sqlalchemy import func
    stats = db.query(
        models.CitizenReport.provincial_council,
        func.count(models.CitizenReport.id).label("count")
    ).group_by(models.CitizenReport.provincial_council).all()
    
    return [{"province": s[0] or "Unassigned", "count": s[1]} for s in stats]

@router.get("/history", response_model=schemas.PaginatedAuditLogResponse)
def get_reports_history(
    page: int = 1,
    limit: int = 10,
    action: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db), 
    current_user: models.User = Depends(require_staff)
):
    logger.info(f"GET /history (paginated) called by {current_user.email}, Page: {page}")
    
    query = db.query(models.AuditLog)
    
    # Jurisdictional Filtering
    if current_user.role == "MAINTENANCE_OFFICER":
        query = query.join(models.CitizenReport).filter(
            models.CitizenReport.provincial_council == current_user.provincial_council
        )
        
    # Content Filtering
    if action and action != 'ALL':
        query = query.filter(models.AuditLog.action == action)
        
    if search:
        search_filter = f"%{search}%"
        query = query.filter(
            (models.AuditLog.notes.ilike(search_filter)) |
            (models.AuditLog.report_id.ilike(search_filter)) |
            (models.AuditLog.user_id.ilike(search_filter))
        )
        
    total = query.count()
    total_pages = (total + limit - 1) // limit if limit > 0 else 0
    
    results = query.order_by(models.AuditLog.created_at.desc()) \
                  .offset((page - 1) * limit) \
                  .limit(limit) \
                  .all()
                  
    return {
        "data": results,
        "total": total,
        "page": page,
        "limit": limit,
        "total_pages": total_pages
    }

@router.get("/{report_id}/history", response_model=List[schemas.AuditLogRead])
def get_report_history(report_id: str, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    """Returns all audit logs for a specific report."""
    # Auth check
    report = db.query(models.CitizenReport).filter(models.CitizenReport.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
        
    if current_user.role == "MAINTENANCE_OFFICER" and report.provincial_council != current_user.provincial_council:
        raise HTTPException(status_code=403, detail="Access Restricted")
        
    return db.query(models.AuditLog).filter(models.AuditLog.report_id == report_id).order_by(models.AuditLog.created_at.desc()).all()

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

    # Create Audit Log
    crud.create_audit_log(
        db,
        report_id=report_id,
        user_id=current_user.id,
        action=f"Status Update: {old_status} -> {next_status or old_status}",
        old_status=old_status,
        new_status=next_status or old_status,
        notes=update.notes
    )

    # Create Status Update History
    crud.create_status_update(
        db,
        update=update,
        report_id=report_id,
        officer_id=current_user.id
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
    if "status" in changed_fields or "priority" in changed_fields or "provincial_council" in changed_fields or "district" in changed_fields:
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
