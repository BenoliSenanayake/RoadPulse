from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from .. import schemas, models
from ..database import get_db

router = APIRouter(prefix="/auth", tags=["auth"])

from ..security import verify_password, get_password_hash
import logging

logger = logging.getLogger(__name__)

@router.post("/login")
def login(request: schemas.LoginRequest, db: Session = Depends(get_db)):
    # 8. ADD TEMPORARY LOGIN DEBUG LOGS
    logger.info(f"Login attempt received for email: {request.email}")
    
    user = db.query(models.User).filter(models.User.email == request.email).first()
    
    if not user:
        logger.warning(f"Login failed: User not found for email: {request.email}")
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    # 5. VERIFY PASSWORD HASHING
    is_password_valid = verify_password(request.password, user.password_hash)
    
    # Log user found and role
    logger.info(f"User found: True, Role: {user.role}, Password valid: {is_password_valid}")

    if not is_password_valid:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    # 7. FIX ADMIN LOGIN VALIDATION
    if user.role == "ADMIN":
        logger.info("Admin login successful")
        return {"token": "mock-jwt-token", "user": {
            "id": user.id, 
            "name": user.name,
            "email": user.email,
            "role": user.role,
            "provincialCouncil": user.provincial_council
        }}

    # 6. FIX STAFF LOGIN VALIDATION
    if user.role == "MAINTENANCE_OFFICER":
        stored_province = user.provincial_council
        selected_province = request.provincial_council
        
        logger.info(f"Staff login: Stored province: {stored_province}, Selected province: {selected_province}")
        
        if stored_province != selected_province:
            logger.warning(f"Province mismatch for {request.email}. Expected {stored_province}, got {selected_province}")
            raise HTTPException(
                status_code=401, 
                detail="Selected province does not match assigned officer account."
            )
        
        logger.info("Staff login successful")
        return {"token": "mock-jwt-token", "user": {
            "id": user.id, 
            "name": user.name,
            "email": user.email,
            "role": user.role,
            "provincialCouncil": user.provincial_council
        }}

    # Default for CITIZEN or other roles
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
        password_hash=get_password_hash(user.password),
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
