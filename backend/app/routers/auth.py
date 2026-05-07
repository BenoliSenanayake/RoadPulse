from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
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

@router.post("/signup")
def signup(user: schemas.UserCreate, db: Session = Depends(get_db)):
    # Check if user exists
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
    return {"success": True}

@router.get("/users")
def get_users(db: Session = Depends(get_db)):
    return db.query(models.User).all()
