from pydantic import BaseModel, Field
from typing import Optional, List, Any
from datetime import datetime
from enum import Enum

class UserBase(BaseModel):
    name: str
    email: str
    role: str

class UserCreate(UserBase):
    password: str

class UserResponse(UserBase):
    id: str
    created_at: datetime
    class Config:
        from_attributes = True

class ReportCreate(BaseModel):
    citizenId: str
    lat: float
    lon: float
    description: Optional[str] = None

class ReportResponse(BaseModel):
    id: str
    citizenId: str
    lat: float
    lon: float
    description: Optional[str]
    imageUrl: str
    aiStatus: str
    aiConfidence: Optional[float]
    aiReason: Optional[str]
    bbox: Optional[List[float]]
    status: str
    createdAt: datetime
    class Config:
        from_attributes = True
        populate_by_name = True

class DetectionResult(BaseModel):
    detected: bool
    aiStatus: str
    confidence: float
    message: str
    bbox: Optional[List[float]] = None
    modelVersion: str
