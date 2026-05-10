import os
import sys

# Add the current directory to sys.path to import app
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy.orm import Session
from app.database import SessionLocal, engine, Base
from app import models
from app.security import get_password_hash

def seed_users():
    print("Starting user seeding...")
    db = SessionLocal()
    
    users_to_seed = [
        # Admin
        {
            "name": "System Administrator",
            "email": "admin@roadpulse.gov.lk",
            "password": "RoadPulse@Admin2026",
            "role": "ADMIN",
            "provincial_council": None
        },
        # Provincial Officers
        {
            "name": "Western Province Officer",
            "email": "western.officer@roadpulse.gov.lk",
            "password": "Western@2026",
            "role": "MAINTENANCE_OFFICER",
            "provincial_council": "Western Provincial Council"
        },
        {
            "name": "Central Province Officer",
            "email": "central.officer@roadpulse.gov.lk",
            "password": "Central@2026",
            "role": "MAINTENANCE_OFFICER",
            "provincial_council": "Central Provincial Council"
        },
        {
            "name": "Southern Province Officer",
            "email": "southern.officer@roadpulse.gov.lk",
            "password": "Southern@2026",
            "role": "MAINTENANCE_OFFICER",
            "provincial_council": "Southern Provincial Council"
        },
        {
            "name": "Northern Province Officer",
            "email": "northern.officer@roadpulse.gov.lk",
            "password": "Northern@2026",
            "role": "MAINTENANCE_OFFICER",
            "provincial_council": "Northern Provincial Council"
        },
        {
            "name": "Eastern Province Officer",
            "email": "eastern.officer@roadpulse.gov.lk",
            "password": "Eastern@2026",
            "role": "MAINTENANCE_OFFICER",
            "provincial_council": "Eastern Provincial Council"
        },
        {
            "name": "North Western Province Officer",
            "email": "northwestern.officer@roadpulse.gov.lk",
            "password": "NorthWest@2026",
            "role": "MAINTENANCE_OFFICER",
            "provincial_council": "North Western Provincial Council"
        },
        {
            "name": "North Central Province Officer",
            "email": "northcentral.officer@roadpulse.gov.lk",
            "password": "NorthCentral@2026",
            "role": "MAINTENANCE_OFFICER",
            "provincial_council": "North Central Provincial Council"
        },
        {
            "name": "Uva Province Officer",
            "email": "uva.officer@roadpulse.gov.lk",
            "password": "Uva@2026",
            "role": "MAINTENANCE_OFFICER",
            "provincial_council": "Uva Provincial Council"
        },
        {
            "name": "Sabaragamuwa Province Officer",
            "email": "sabaragamuwa.officer@roadpulse.gov.lk",
            "password": "Sabaragamuwa@2026",
            "role": "MAINTENANCE_OFFICER",
            "provincial_council": "Sabaragamuwa Provincial Council"
        }
    ]

    for user_data in users_to_seed:
        # Check if user exists
        db_user = db.query(models.User).filter(models.User.email == user_data["email"]).first()
        
        if db_user:
            print(f"Updating existing user: {user_data['email']}")
            db_user.name = user_data["name"]
            db_user.role = user_data["role"]
            db_user.provincial_council = user_data["provincial_council"]
            db_user.password_hash = get_password_hash(user_data["password"])
            db_user.account_status = "ACTIVE"
        else:
            print(f"Creating new user: {user_data['email']}")
            new_user = models.User(
                name=user_data["name"],
                email=user_data["email"],
                password_hash=get_password_hash(user_data["password"]),
                role=user_data["role"],
                provincial_council=user_data["provincial_council"],
                account_status="ACTIVE"
            )
            db.add(new_user)
    
    db.commit()
    db.close()
    print("User seeding completed successfully!")

if __name__ == "__main__":
    seed_users()
