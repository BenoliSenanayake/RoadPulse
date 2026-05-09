from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from .. import schemas, models
from ..database import get_db

router = APIRouter(prefix="/auth", tags=["auth"])

@router.post("/login")
def login(request: schemas.LoginRequest, db: Session = Depends(get_db)):
    # Very basic placeholder - compare password directly for now
    user = db.query(models.User).filter(models.User.email == request.email).first()
    if not user or user.password_hash != request.password:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    return {"token": "mock-jwt-token", "user": {
        "id": user.id, 
        "name": user.name,
        "email": user.email,
        "role": user.role,
        "provincialCouncil": user.provincial_council
    }}

@router.post("/signup", response_model=schemas.UserRead)
def signup(user: schemas.UserCreate, db: Session = Depends(get_db)):
    if db.query(models.User).filter(models.User.email == user.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")

    db_user = models.User(
        name=user.name,
        email=user.email,
        password_hash=user.password,
        role=user.role,
        provincial_council=user.provincial_council
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

@router.get("/staff/verify")
def verify_staff(email: str, db: Session = Depends(get_db)):
    """Verify a staff or admin user by email. Used by frontend AuthContext for officer/admin login."""
    user = db.query(models.User).filter(models.User.email == email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.role not in ("MAINTENANCE_OFFICER", "ADMIN"):
        raise HTTPException(status_code=403, detail="Not a staff or admin user")
    
    return {
        "id": user.id,
        "name": user.name,
        "email": user.email,
        "role": user.role,
        "provincialCouncil": user.provincial_council,
        "status": user.account_status or "ACTIVE",
        "createdAt": str(user.created_at) if user.created_at else None
    }

@router.get("/check-email")
def check_email(email: str, db: Session = Depends(get_db)):
    """Check if an email is already registered."""
    user = db.query(models.User).filter(models.User.email == email).first()
    return {"exists": user is not None}

@router.get("/users", response_model=List[schemas.UserRead])
def get_users(db: Session = Depends(get_db)):
    return db.query(models.User).all()
