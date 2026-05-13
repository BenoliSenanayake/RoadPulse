from app.database import SessionLocal
from app.models import User
from app.security import get_password_hash
from sqlalchemy import func

def reset_user():
    db = SessionLocal()
    email = 'citizen1@gmail.com'
    
    # Check for any case-insensitive matches too
    users = db.query(User).filter(func.lower(User.email) == email.lower()).all()
    for u in users:
        print(f"Deleting existing user: {u.email}")
        db.delete(u)
    
    db.commit()
    
    new_user = User(
        name='Test Citizen One',
        email=email,
        password_hash=get_password_hash('citizen1@'),
        role='CITIZEN'
    )
    db.add(new_user)
    db.commit()
    print(f"User {email} created successfully with password: citizen1@")
    db.close()

if __name__ == "__main__":
    reset_user()
