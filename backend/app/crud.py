from sqlalchemy.orm import Session
from app import models, schemas
from datetime import datetime

# REPORT SERVICES
def create_report(db: Session, report: schemas.CitizenReportCreate, **kwargs) -> models.CitizenReport:
    db_report = models.CitizenReport(**report.model_dump(), **kwargs)
    db.add(db_report)
    db.commit()
    db.refresh(db_report)
    return db_report

def get_report_by_id(db: Session, report_id: str) -> models.CitizenReport:
    return db.query(models.CitizenReport).filter(models.CitizenReport.id == report_id).first()

def list_reports(db: Session):
    return db.query(models.CitizenReport).order_by(models.CitizenReport.submitted_at.desc()).all()

def list_reports_by_province(db: Session, province: str):
    return db.query(models.CitizenReport).filter(models.CitizenReport.provincial_council == province).order_by(models.CitizenReport.submitted_at.desc()).all()

def update_report_status(db: Session, report_id: str, status: str):
    report = get_report_by_id(db, report_id)
    if report:
        report.status = status
        report.last_status_updated_at = datetime.now()
        db.commit()
        db.refresh(report)
    return report

def update_report_priority(db: Session, report_id: str, priority: str):
    report = get_report_by_id(db, report_id)
    if report:
        report.priority = priority
        db.commit()
        db.refresh(report)
    return report

def update_report_notes(db: Session, report_id: str, notes: str):
    report = get_report_by_id(db, report_id)
    if report:
        report.maintenance_notes = notes
        db.commit()
        db.refresh(report)
    return report

# USER SERVICES
def create_user(db: Session, user: schemas.UserCreate) -> models.User:
    db_user = models.User(
        name=user.name,
        email=user.email,
        password_hash=user.password, # For real app, hash this
        role=user.role,
        provincial_council=user.provincial_council
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

def get_user_by_email(db: Session, email: str) -> models.User:
    return db.query(models.User).filter(models.User.email == email).first()

def get_users(db: Session):
    return db.query(models.User).all()

def get_user_by_id(db: Session, user_id: str) -> models.User:
    return db.query(models.User).filter(models.User.id == user_id).first()

# AUDIT SERVICES
def create_audit_log(db: Session, report_id: str, user_id: str, action: str, old_status: str = None, new_status: str = None, notes: str = None):
    log = models.AuditLog(
        report_id=report_id,
        user_id=user_id,
        action=action,
        old_status=old_status,
        new_status=new_status,
        notes=notes
    )
    db.add(log)
    db.commit()
    db.refresh(log)
    return log

def list_audit_logs(db: Session):
    return db.query(models.AuditLog).order_by(models.AuditLog.created_at.desc()).all()

# STATUS UPDATE SERVICES
def create_status_update(db: Session, update: schemas.StatusUpdateCreate, report_id: str, officer_id: str):
    db_update = models.StatusUpdate(
        report_id=report_id,
        officer_id=officer_id,
        status=update.status,
        priority=update.priority,
        notes=update.notes
    )
    db.add(db_update)
    db.commit()
    db.refresh(db_update)
    return db_update

# DETECTION SERVICES
def create_detection_result(db: Session, result: dict, report_id: str):
    db_result = models.DetectionResult(
        report_id=report_id,
        detected=result.get("detected", False),
        confidence=result.get("aiConfidence"),
        classification=result.get("aiClassification"),
        prediction_count=result.get("predictionCount", 0),
        bbox=result.get("bbox"),
        raw_response=result.get("raw_response"),
        model_id=result.get("detectionModel")
    )
    db.add(db_result)
    db.commit()
    db.refresh(db_result)
    return db_result
