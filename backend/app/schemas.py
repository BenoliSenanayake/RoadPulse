from pydantic import BaseModel
from typing import Optional, List, Dict, Any, TypeVar, Generic
from datetime import datetime

T = TypeVar("T")

class UserBase(BaseModel):
    name: str
    email: str
    role: str
    provincial_council: Optional[str] = None
    account_status: str = "ACTIVE"

class UserCreate(UserBase):
    password: str

class UserRead(UserBase):
    id: str
    created_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

class LoginRequest(BaseModel):
    email: str
    password: str
    provincial_council: Optional[str] = None

class CitizenReportBase(BaseModel):
    description: Optional[str] = None
    latitude: float
    longitude: float

class CitizenReportCreate(CitizenReportBase):
    citizen_id: str

class DetectionResult(BaseModel):
    detected: bool
    confidence: Optional[float] = None
    classification: Optional[str] = None
    prediction_count: Optional[int] = None
    bbox: Optional[Any] = None
    model_id: Optional[str] = None
    created_at: Optional[datetime] = None
    raw_response: Optional[Dict[str, Any]] = None

class DetectionResultRead(BaseModel):
    id: str
    report_id: str
    detected: bool
    confidence: Optional[float] = None
    classification: Optional[str] = None
    prediction_count: int
    bbox: Optional[List[float]] = None
    raw_response: Optional[Dict[str, Any]] = None
    model_id: Optional[str] = None
    created_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

class CitizenReportRead(CitizenReportBase):
    id: str
    citizen_id: str
    image_url: str
    address: Optional[str] = None
    district: Optional[str] = None
    provincial_council: Optional[str] = None
    status: str
    priority: Optional[str] = None
    ai_classification: Optional[str] = None
    ai_confidence: Optional[float] = None
    prediction_count: int = 0
    bbox: Optional[List[float]] = None
    detection_model: Optional[str] = None
    detection_timestamp: Optional[datetime] = None
    maintenance_notes: Optional[str] = None
    submitted_at: Optional[datetime] = None
    last_status_updated_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

class CitizenReportUpdate(BaseModel):
    status: Optional[str] = None
    priority: Optional[str] = None
    maintenance_notes: Optional[str] = None

class AuditLogRead(BaseModel):
    id: str
    report_id: Optional[str] = None
    user_id: str
    action: str
    old_status: Optional[str] = None
    new_status: Optional[str] = None
    notes: Optional[str] = None
    created_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

class StatusUpdateCreate(BaseModel):
    status: str
    priority: Optional[str] = None
    notes: Optional[str] = None

class StatusUpdateRead(BaseModel):
    id: str
    report_id: str
    officer_id: str
    status: str
    priority: Optional[str] = None
    notes: Optional[str] = None
    created_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

# Pagination Schemas
class PaginatedResponse(BaseModel, Generic[T]):
    data: List[T]
    total: int
    page: int
    limit: int
    total_pages: int

class PaginatedReportResponse(PaginatedResponse[CitizenReportRead]):
    pass

class PaginatedUserResponse(PaginatedResponse[UserRead]):
    pass

class PaginatedAuditLogResponse(PaginatedResponse[AuditLogRead]):
    pass
