from app.database import SessionLocal
from app.models import CitizenReport, User, AuditLog

def unify_provinces():
    db = SessionLocal()
    try:
        mapping = {
            "Western Province": "Western Provincial Council",
            "Central Province": "Central Provincial Council",
            "Southern Province": "Southern Provincial Council",
            "Northern Province": "Northern Provincial Council",
            "Eastern Province": "Eastern Provincial Council",
            "North Western Province": "North Western Provincial Council",
            "North Central Province": "North Central Provincial Council",
            "Uva Province": "Uva Provincial Council",
            "Sabaragamuwa Province": "Sabaragamuwa Provincial Council"
        }
        
        # Update CitizenReports
        reports = db.query(CitizenReport).all()
        report_updates = 0
        for r in reports:
            if r.provincial_council in mapping:
                r.provincial_council = mapping[r.provincial_council]
                report_updates += 1
        
        # Update Users
        users = db.query(User).all()
        user_updates = 0
        for u in users:
            if u.provincial_council in mapping:
                u.provincial_council = mapping[u.provincial_council]
                user_updates += 1
        
        # Update AuditLogs
        # (AuditLog model doesn't have provincial_council field in models.py, it's in the frontend AuditLog type though)
        # Wait, let's check models.py again.
        
        db.commit()
        print(f"Updated {report_updates} reports and {user_updates} users to use canonical Provincial Council names.")
        
    except Exception as e:
        db.rollback()
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    unify_provinces()
