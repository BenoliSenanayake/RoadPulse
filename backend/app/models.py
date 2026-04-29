from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text, Enum
from sqlalchemy.orm import relationship
import enum
from datetime import datetime
from .database import Base

class UserRole(enum.Enum):
    CITIZEN = "CITIZEN"
    MAINTENANCE_OFFICER = "MAINTENANCE_OFFICER"
    ADMIN = "ADMIN"

class PotholeStatus(enum.Enum):
    NEW = "New"
    CONFIRMED = "Confirmed"
    SCHEDULED = "Scheduled"
    FIXED = "Fixed"
    REJECTED = "Rejected"

class AIStatus(enum.Enum):
    PENDING = "PENDING"
    ACCEPTED = "ACCEPTED"
    REJECTED = "REJECTED"

class User(Base):
    __tablename__ = "users"
    id = Column(String, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    role = Column(Enum(UserRole), default=UserRole.CITIZEN)
    password_hash = Column(String)
    phone = Column(String)
    district = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)

class CitizenReport(Base):
    __tablename__ = "citizen_reports"
    id = Column(String, primary_key=True, index=True)
    citizen_id = Column(String, ForeignKey("users.id"))
    lat = Column(Float, nullable=False)
    lon = Column(Float, nullable=False)
    description = Column(Text)
    image_url = Column(String, nullable=False)
    ai_status = Column(Enum(AIStatus), default=AIStatus.PENDING)
    ai_confidence = Column(Float)
    ai_reason = Column(Text)
    bbox = Column(String) # JSON string [x, y, w, h]
    linked_pothole_id = Column(String, ForeignKey("potholes.id"))
    status = Column(String, default="New")
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User")
    linked_pothole = relationship("PotholeEvent", back_populates="reports", foreign_keys=[linked_pothole_id])

class PotholeEvent(Base):
    __tablename__ = "potholes"
    id = Column(String, primary_key=True, index=True)
    lat = Column(Float, nullable=False)
    lon = Column(Float, nullable=False)
    confidence = Column(Float)
    status = Column(Enum(PotholeStatus), default=PotholeStatus.NEW)
    road_name = Column(String)
    district = Column(String)
    image_url = Column(String)
    source = Column(String) # SYSTEM | CITIZEN_REPORT
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    reports = relationship("CitizenReport", back_populates="linked_pothole", foreign_keys="[CitizenReport.linked_pothole_id]")
    repairs = relationship("RepairUpdate", back_populates="pothole")

class RepairUpdate(Base):
    __tablename__ = "repair_updates"
    id = Column(String, primary_key=True, index=True)
    pothole_id = Column(String, ForeignKey("potholes.id"))
    status = Column(Enum(PotholeStatus))
    note = Column(Text)
    updated_by = Column(String, ForeignKey("users.id"))
    updated_at = Column(DateTime, default=datetime.utcnow)

    pothole = relationship("PotholeEvent", back_populates="repairs")
    user = relationship("User")

class AuditLog(Base):
    __tablename__ = "audit_logs"
    id = Column(String, primary_key=True, index=True)
    timestamp = Column(DateTime, default=datetime.utcnow)
    entity_id = Column(String, index=True)
    entity_type = Column(String) # POTHOLE or REPORT
    action = Column(String)
    actor = Column(String) # CITIZEN, SYSTEM, MAINTENANCE_OFFICER, ADMIN
    actor_name = Column(String)
    details = Column(Text)
