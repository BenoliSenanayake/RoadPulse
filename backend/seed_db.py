import os
from sqlalchemy.orm import Session
from app.database import engine, Base, SessionLocal
from app import models, crud, schemas
from datetime import datetime, timedelta
import random
import uuid

def seed():
    # Drop and recreate all tables
    print("Resetting database...")
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    
    print("Seeding Users...")
    users_to_create = [
        schemas.UserCreate(name="Admin User", email="admin@roadpulse.gov.lk", password="password", role="ADMIN"),
        schemas.UserCreate(name="John Doe", email="officer1@roadpulse.gov.lk", password="password", role="MAINTENANCE_OFFICER", provincial_council="Western Province"),
        schemas.UserCreate(name="Jane Smith", email="officer2@roadpulse.gov.lk", password="password", role="MAINTENANCE_OFFICER", provincial_council="Central Province"),
        schemas.UserCreate(name="Citizen 1", email="citizen1@example.com", password="password", role="CITIZEN"),
    ]
    
    users = []
    for u in users_to_create:
        users.append(crud.create_user(db, u))
        
    citizen_id = users[3].id
    officer_id = users[1].id
    
    print("Seeding Reports...")
    provinces = ["Western Province", "Central Province", "Southern Province"]
    statuses = ["New", "Verified", "In Progress", "Completed", "Rejected"]
    classifications = ["VERIFIED_POTHOLE", "NEEDS_MANUAL_REVIEW", "REJECTED"]
    
    # Let's create some overdue reports (more than 14 days old and not completed)
    for i in range(15):
        is_overdue = i < 3
        created_at = datetime.utcnow() - timedelta(days=20) if is_overdue else datetime.utcnow() - timedelta(days=random.randint(0, 10))
        
        status = "New" if is_overdue else random.choice(statuses)
        ai_class = "VERIFIED_POTHOLE" if status in ["Verified", "In Progress", "Completed"] else random.choice(classifications)
        conf = random.uniform(0.5, 0.95) if ai_class != "REJECTED" else random.uniform(0.1, 0.49)
        
        report_in = schemas.CitizenReportCreate(
            citizen_id=citizen_id,
            description=f"Pothole reported near Location {i}",
            latitude=6.9271 + random.uniform(-0.1, 0.1),
            longitude=79.8612 + random.uniform(-0.1, 0.1),
        )
        
        # We write directly using the model to override timestamps
        report_id = f"rep-{uuid.uuid4().hex[:8]}"
        db_report = models.CitizenReport(
            id=report_id,
            citizen_id=citizen_id,
            image_url="https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&q=80",
            description=report_in.description,
            latitude=report_in.latitude,
            longitude=report_in.longitude,
            district="Colombo",
            provincial_council=random.choice(provinces),
            status=status,
            priority=random.choice(["Low", "Medium", "High", "Urgent"]),
            ai_classification=ai_class,
            ai_confidence=conf,
            prediction_count=1 if ai_class != "REJECTED" else 0,
            submitted_at=created_at,
            last_status_updated_at=created_at + timedelta(days=1),
        )
        db.add(db_report)
        
        # Detection
        db_det = models.DetectionResult(
            report_id=report_id,
            detected=(ai_class != "REJECTED"),
            confidence=conf,
            classification=ai_class,
            prediction_count=1 if ai_class != "REJECTED" else 0,
            bbox=[0.4, 0.4, 0.2, 0.2] if ai_class != "REJECTED" else None,
            created_at=created_at
        )
        db.add(db_det)
        
        # Audit log
        db_log = models.AuditLog(
            report_id=report_id,
            user_id=citizen_id,
            action="REPORT_SUBMITTED",
            new_status=status,
            notes="Citizen submitted a new report",
            created_at=created_at
        )
        db.add(db_log)
        
        if status != "New":
            db_log2 = models.AuditLog(
                report_id=report_id,
                user_id=officer_id,
                action="STATUS_UPDATED",
                old_status="New",
                new_status=status,
                notes="Officer reviewed report",
                created_at=created_at + timedelta(days=1)
            )
            db.add(db_log2)
            
    db.commit()
    print("Seed completed successfully!")

if __name__ == "__main__":
    seed()
