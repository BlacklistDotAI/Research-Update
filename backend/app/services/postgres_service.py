# app/core/postgres_service.py
"""
PostgresService - Centralized PostgreSQL operations with proper encapsulation.
Provides a clean interface for database operations used throughout the application.
"""
import logging
from typing import Optional, Generator
from sqlalchemy.orm import Session
from sqlalchemy import text
from contextlib import contextmanager
from app.core.postgres_client import SessionLocal, get_db

logger = logging.getLogger(__name__)


class PostgresService:
    """
    Service class for PostgreSQL operations.
    Centralizes all database interactions with proper session management.
    """
    
    def __init__(self, session_factory=None):
        """
        Initialize PostgresService.
        
        Args:
            session_factory: SQLAlchemy session factory. If None, uses default.
        """
        self.session_factory = session_factory or SessionLocal
    
    # ============================================================================
    # SESSION MANAGEMENT
    # ============================================================================
    
    def get_session(self) -> Generator[Session, None, None]:
        """
        Get a database session with automatic cleanup.
        
        Yields:
            Session: SQLAlchemy session
            
        Example:
            for session in postgres_service.get_session():
                session.query(User).all()
        """
        session = self.session_factory()
        try:
            yield session
        finally:
            session.close()
    
    @contextmanager
    def session_scope(self):
        """
        Provide a transactional scope for database operations.
        
        Yields:
            Session: SQLAlchemy session with automatic commit/rollback
            
        Example:
            with postgres_service.session_scope() as session:
                session.add(new_user)
                # Automatically commits on success, rolls back on exception
        """
        session = self.session_factory()
        try:
            yield session
            session.commit()
        except Exception:
            session.rollback()
            raise
        finally:
            session.close()
    
    # ============================================================================
    # QUERY OPERATIONS
    # ============================================================================
    
    def execute_query(self, session: Session, query: str, params: dict = None):
        """
        Execute a raw SQL query.
        
        Args:
            session: Database session
            query: SQL query string
            params: Query parameters
            
        Returns:
            Query result
        """
        return session.execute(text(query), params or {})
    
    def health_check(self) -> bool:
        """
        Check database connection health.
        
        Returns:
            bool: True if connection is healthy
        """
        try:
            session = next(get_db())
            session.execute(text("SELECT 1"))
            session.close()
            return True
        except Exception as e:
            logger.error(f"Database health check failed: {e}")
            return False


# Singleton instance
_postgres_service: Optional[PostgresService] = None


def get_postgres_service() -> PostgresService:
    """
    Get singleton PostgresService instance.
    
    Returns:
        PostgresService: Singleton service instance
    """
    global _postgres_service
    if _postgres_service is None:
        _postgres_service = PostgresService()
    return _postgres_service
