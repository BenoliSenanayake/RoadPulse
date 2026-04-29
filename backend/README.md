# RoadPulse FastAPI Backend

This is the Python backend for the RoadPulse application, responsible for data persistence, authentication, and serving as the AI inference endpoint for YOLO pothole detection.

## Prerequisites
- Python 3.9+
- PostgreSQL

## Setup Instructions

1. **Create Virtual Environment**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows use: venv\Scripts\activate
   ```

2. **Install Dependencies**
   ```bash
   pip install -r requirements.txt
   ```

3. **Configure Database**
   By default, the application connects to a local PostgreSQL database via the `DATABASE_URL` environment variable:
   `postgresql://postgres:postgres@localhost:5432/roadpulse`
   
   Ensure PostgreSQL is running and you have created a database named `roadpulse`.
   If your credentials differ, export the correct URL:
   ```bash
   # Windows PowerShell
   $env:DATABASE_URL="postgresql://user:pass@localhost:5432/roadpulse"
   ```

4. **Run the Server**
   ```bash
   uvicorn app.main:app --reload --port 8000
   ```
   
   The backend will be available at `http://localhost:8000`.
   Interactive API documentation (Swagger) is available at `http://localhost:8000/docs`.

## Structure
- `/app/models.py`: SQLAlchemy ORM definitions for Postgres.
- `/app/schemas.py`: Pydantic models for request validation.
- `/app/routers/`: API endpoints (Auth, Reports, AI inference).
- `/app/services/ai_service.py`: Placeholder simulation for the YOLO AI detection pipeline.
- `/uploads/`: Directory where submitted citizen images are stored locally.
