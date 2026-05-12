from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
from .database import engine, Base, get_db
from .routers import auth, reports, ai
from .security import require_admin
from .models import User
import os
import logging

# Configure Logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)

# Create DB Tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="RoadPulse Backend API", version="1.0.0")

# CORS config
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Allow all origins for development to support multi-portal workflow (5173, 5174, 5175)
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static files for uploads
os.makedirs("uploads", exist_ok=True)
app.mount("/static", StaticFiles(directory="uploads"), name="static")

# Include Routers
app.include_router(auth.router)
app.include_router(reports.router)
app.include_router(ai.router)

@app.get("/")
def root():
    return {"message": "Welcome to RoadPulse API"}

@app.get("/api/health")
def health_check():
    return {"status": "ok", "backend": "connected"}

@app.get("/debug/db")
def debug_db(db: Session = Depends(get_db)):
    try:
        from sqlalchemy import text
        db.execute(text("SELECT 1"))
        return {
            "database_connected": True,
            "engine": str(engine.url).split("@")[-1], # Hide credentials
            "status": "ready"
        }
    except Exception as e:
        return {"database_connected": False, "error": str(e)}


@app.get("/debug/reports")
def debug_reports(db: Session = Depends(get_db), current_user: User = Depends(require_admin)):
    from .models import CitizenReport
    count = db.query(CitizenReport).count()
    latest = db.query(CitizenReport).order_by(CitizenReport.submitted_at.desc()).limit(10).all()
    
    return {
        "total_count": count,
        "latest_reports": [
            {
                "id": r.id,
                "citizen_id": r.citizen_id,
                "status": r.status,
                "district": r.district,
                "provincial_council": r.provincial_council,
                "submitted_at": r.submitted_at
            } for r in latest
        ]
    }
