from sqlalchemy import select
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models import CitizenReport, User

db = SessionLocal()
try:
    report_count = db.query(CitizenReport).count()
    print(f"Total Citizen Reports: {report_count}")
    
    reports = db.query(CitizenReport).order_by(CitizenReport.submitted_at.desc()).limit(5).all()
    for r in reports:
        print(f"ID: {r.id}, Province: {r.provincial_council}, Status: {r.status}, Submitted At: {r.submitted_at}")
        
    user_count = db.query(User).count()
    print(f"Total Users: {user_count}")
    
    users = db.query(User).all()
    for u in users:
        print(f"Email: {u.email}, Role: {u.role}, Province: {u.provincial_council}")
finally:
    db.close()
