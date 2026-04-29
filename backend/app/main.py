from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from .database import engine, Base
from .routers import auth, reports, ai
import os

# Create DB Tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="RoadPulse Backend API", version="1.0.0")

# CORS config
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"], # Vite default port
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
