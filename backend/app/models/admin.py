# app/models/admin.py
"""
Admin user model for authentication and authorization.
Stores admin credentials securely in PostgreSQL.
"""
from sqlalchemy import Column, Integer, String, DateTime, Boolean
from sqlalchemy.sql import func
from app.core.postgres_client import Base


class Admin(Base):
    """
    Admin user model.
    
    Stores admin account credentials in PostgreSQL for persistence
    and proper relational data management.
    """
    __tablename__ = "admins"
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, nullable=False, index=True)
    email = Column(String, unique=True, nullable=False, index=True)
    hashed_password = Column(String, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    is_superuser = Column(Boolean, default=False, nullable=False)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    
    def __repr__(self):
        return f"<Admin(username='{self.username}', email='{self.email}')>"
