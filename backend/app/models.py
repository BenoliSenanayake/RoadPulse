from sqlalchemy import Column, String, Float, Integer, Boolean, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base
import uuid

def generate_uuid(prefix: str):
    return f"{prefix}-{uuid.uuid4().hex[:8]}"

class User(Base):
    __tablename__ = "users"
    
    id = Column(String, primary_key=True, default=lambda: generate_uuid("usr"))
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    role = Column(String, nullable=False) # CITIZEN, MAINTENANCE_OFFICER, ADMIN
    provincial_council = Column(String, nullable=True)
    account_status = Column(String, default="ACTIVE")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    reports = relationship("CitizenReport", back_populates="citizen")
    audit_logs = relationship("AuditLog", back_populates="user")
    status_updates = relationship("StatusUpdate", back_populates="officer")

class CitizenReport(Base):
    __tablename__ = "citizen_reports"
    
    id = Column(String, primary_key=True, default=lambda: generate_uuid("rep"))
    citizen_id = Column(String, ForeignKey("users.id"), nullable=False)
    image_url = Column(String, nullable=False)
    description = Column(String, nullable=True)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    address = Column(String, nullable=True)
    district = Column(String, nullable=True)
    provincial_council = Column(String, nullable=True)
    
    status = Column(String, default="New") # New, Verified, In Progress, Completed, Rejected
    priority = Column(String, nullable=True) # Low, Medium, High, Urgent
    
    # AI Fields
    ai_classification = Column(String, nullable=True)
    ai_confidence = Column(Float, nullable=True)
    prediction_count = Column(Integer, default=0)
    bbox = Column(JSON, nullable=True)
    detection_model = Column(String, nullable=True)
    detection_timestamp = Column(DateTime(timezone=True), nullable=True)
    
    maintenance_notes = Column(String, nullable=True)
    submitted_at = Column(DateTime(timezone=True), server_default=func.now())
    last_status_updated_at = Column(DateTime(timezone=True), nullable=True)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    citizen = relationship("User", back_populates="reports")
    detection_results = relationship("DetectionResult", back_populates="report", cascade="all, delete-orphan")
    audit_logs = relationship("AuditLog", back_populates="report", cascade="all, delete-orphan")
    status_updates = relationship("StatusUpdate", back_populates="report", cascade="all, delete-orphan")

class DetectionResult(Base):
    __tablename__ = "detection_results"
    
    id = Column(String, primary_key=True, default=lambda: generate_uuid("det"))
    report_id = Column(String, ForeignKey("citizen_reports.id"), nullable=False)
    detected = Column(Boolean, default=False)
    confidence = Column(Float, nullable=True)
    classification = Column(String, nullable=True)
    prediction_count = Column(Integer, default=0)
    bbox = Column(JSON, nullable=True)
    raw_response = Column(JSON, nullable=True)
    model_id = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    report = relationship("CitizenReport", back_populates="detection_results")

class AuditLog(Base):
    __tablename__ = "audit_logs"
    
    id = Column(String, primary_key=True, default=lambda: generate_uuid("aud"))
    report_id = Column(String, ForeignKey("citizen_reports.id"), nullable=True)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    action = Column(String, nullable=False)
    old_status = Column(String, nullable=True)
    new_status = Column(String, nullable=True)
    notes = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    report = relationship("CitizenReport", back_populates="audit_logs")
    user = relationship("User", back_populates="audit_logs")

class StatusUpdate(Base):
    __tablename__ = "status_updates"
    
    id = Column(String, primary_key=True, default=lambda: generate_uuid("upd"))
    report_id = Column(String, ForeignKey("citizen_reports.id"), nullable=False)
    officer_id = Column(String, ForeignKey("users.id"), nullable=False)
    status = Column(String, nullable=False)
    priority = Column(String, nullable=True)
    notes = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    report = relationship("CitizenReport", back_populates="status_updates")
    officer = relationship("User", back_populates="status_updates")
