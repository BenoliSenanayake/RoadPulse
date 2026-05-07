# RoadPulse Backend API

The backend is built with FastAPI, PostgreSQL, and SQLAlchemy, and integrates with Roboflow for AI pothole detection.

## Setup Instructions

### 1. Configure PostgreSQL
- Ensure you have PostgreSQL installed and running on your local machine.
- Create a database named `roadpulse`. You can do this by running `psql -U postgres` and then `CREATE DATABASE roadpulse;`.

### 2. Configure .env
Create a `.env` file in this `backend` directory (if it doesn't exist already) and add your environment variables:
```env
DATABASE_URL=postgresql://postgres:YOURPASSWORD@localhost:5432/roadpulse
ROBOFLOW_API_KEY=YOUR_ROBOFLOW_API_KEY
SECRET_KEY=roadpulse_secret_key
ENVIRONMENT=development
```

### 3. Initialize Tables & Seed Data
You can initialize the database tables by running the init script:
```bash
python app/init_db.py
```
To populate the database with mock admin, citizens, and reports, run the seed script from the root:
```bash
python backend/seed_db.py
```

### 4. Start the Backend
Run the FastAPI application with Uvicorn:
```bash
uvicorn app.main:app --reload --port 8000
```

The API will be available at `http://localhost:8000`. You can view the Swagger documentation at `http://localhost:8000/docs`.
