#!/usr/bin/env python3
"""
CLI tool to create admin users securely.
This should be run by system administrators only, NOT exposed as a public API.

Usage:
    python scripts/create_admin.py

Security:
    - Interactive password entry (not logged)
    - Stored in PostgreSQL (persistent)
    - No public API exposure
"""
import sys
import os
import getpass
from pathlib import Path

# Add project root to Python path
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

from sqlalchemy.orm import Session
from app.core.postgres_client import SessionLocal
from app.models.admin import Admin
from app.services.auth_service import get_password_hash


def create_admin():
    """Interactively create an admin user."""
    print("=" * 60)
    print("🔐 CREATE ADMIN USER")
    print("=" * 60)
    print()
    
    # Get username
    while True:
        username = input("Enter username: ").strip()
        if not username:
            print("❌ Username cannot be empty")
            continue
        if len(username) < 3:
            print("❌ Username must be at least 3 characters")
            continue
        break
    
    # Get email
    while True:
        email = input("Enter email: ").strip()
        if not email:
            print("❌ Email cannot be empty")
            continue
        if "@" not in email:
            print("❌ Invalid email format")
            continue
        break
    
    # Get password
    while True:
        password = getpass.getpass("Enter password: ")
        if not password:
            print("❌ Password cannot be empty")
            continue
        
        # Check byte length (bcrypt limit is 72 BYTES, not characters!)
        password_bytes = len(password.encode('utf-8'))
        if password_bytes < 8:
            print("❌ Password must be at least 8 bytes")
            continue
        if password_bytes > 72:
            print(f"❌ Password is {password_bytes} bytes, max is 72 bytes (bcrypt limit)")
            print("   Hint: Use shorter password or avoid special Unicode characters")
            continue
        
        password_confirm = getpass.getpass("Confirm password: ")
        if password != password_confirm:
            print("❌ Passwords do not match")
            continue
        
        # All validations passed
        break
    
    # Superuser flag
    is_superuser_input = input("Is superuser? (y/N): ").strip().lower()
    is_superuser = is_superuser_input in ["y", "yes"]
    
    print()
    print("Creating admin user...")
    
    # Create admin in database
    db: Session = SessionLocal()
    try:
        # Check if username already exists
        existing_user = db.query(Admin).filter(Admin.username == username).first()
        if existing_user:
            print(f"❌ Error: Username '{username}' already exists")
            return False
        
        # Check if email already exists
        existing_email = db.query(Admin).filter(Admin.email == email).first()
        if existing_email:
            print(f"❌ Error: Email '{email}' already exists")
            return False
        
        # Hash password
        hashed_password = get_password_hash(password)
        
        # Create admin
        admin = Admin(
            username=username,
            email=email,
            hashed_password=hashed_password,
            is_superuser=is_superuser,
            is_active=True
        )
        
        db.add(admin)
        db.commit()
        db.refresh(admin)
        
        print()
        print("✅ Admin user created successfully!")
        print(f"   Username: {admin.username}")
        print(f"   Email: {admin.email}")
        print(f"   Superuser: {admin.is_superuser}")
        print(f"   Created at: {admin.created_at}")
        print()
        
        return True
        
    except Exception as e:
        db.rollback()
        print(f"❌ Error creating admin: {e}")
        return False
    finally:
        db.close()


if __name__ == "__main__":
    try:
        success = create_admin()
        sys.exit(0 if success else 1)
    except KeyboardInterrupt:
        print("\n\n❌ Cancelled by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ Unexpected error: {e}")
        sys.exit(1)
