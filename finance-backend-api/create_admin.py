"""
CLI script to promote an existing user to admin.

Usage:
    python create_admin.py <email>

Example:
    python create_admin.py admin@example.com
"""
import sys
import os

sys.path.insert(0, os.path.dirname(__file__))

# Import Base first to avoid circular import (base.py registers all models)
import app.db.base  # noqa: F401
from app.db.session import SessionLocal
from app.modules.auth.models import User


def promote_to_admin(email: str) -> None:
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.email == email).first()
        if not user:
            print(f"[ERROR] User '{email}' not found.")
            sys.exit(1)
        if user.is_admin:
            print(f"[INFO] User '{email}' is already an admin.")
            return
        user.is_admin = True
        db.commit()
        print(f"[OK] User '{email}' (id={user.id}) has been promoted to admin.")
    finally:
        db.close()


if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python create_admin.py <email>")
        sys.exit(1)
    promote_to_admin(sys.argv[1])
