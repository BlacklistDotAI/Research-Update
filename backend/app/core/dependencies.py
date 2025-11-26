# app/core/dependencies.py
"""
Dependency injection providers for all services.
Centralizes service instantiation for easy testing and maintainability.
"""
from typing import Generator
from fastapi import Depends
from sqlalchemy.orm import Session

from app.services.redis_service import RedisService, get_redis_service
from app.services.postgres_service import PostgresService, get_postgres_service
from app.services.storage_service import StorageService, get_storage_service


# ============================================================================
# CORE INFRASTRUCTURE SERVICES
# ============================================================================

def provide_redis_service() -> RedisService:
    """
    Provide RedisService instance for dependency injection.
    
    Returns:
        RedisService: Singleton Redis service
    """
    return get_redis_service()


def provide_postgres_service() -> PostgresService:
    """
    Provide PostgresService instance for dependency injection.
    
    Returns:
        PostgresService: Singleton Postgres service
    """
    return get_postgres_service()


def provide_storage_service() -> StorageService:
    """
    Provide StorageService instance for dependency injection.
    
    Returns:
        StorageService: Singleton Storage service
    """
    return get_storage_service()


def provide_db_session() -> Generator[Session, None, None]:
    """
    Provide database session for dependency injection.
    
    Yields:
        Session: SQLAlchemy database session
    """
    postgres_service = get_postgres_service()
    yield from postgres_service.get_session()


# ============================================================================
# BUSINESS LOGIC SERVICES (imported after service files are refactored)
# ============================================================================

# These will be uncommented as we refactor each service

# from app.services.auth_service import AuthService, get_auth_service
# from app.services.queue_service import QueueService, get_queue_service
# from app.services.phone_service import PhoneService, get_phone_service
# from app.services.captcha_service import CaptchaService, get_captcha_service
# from app.services.email_service import EmailService, get_email_service

# def provide_auth_service(
#     redis_service: RedisService = Depends(provide_redis_service)
# ) -> AuthService:
#     """Provide AuthService instance."""
#     return get_auth_service(redis_service)

# def provide_queue_service(
#     redis_service: RedisService = Depends(provide_redis_service)
# ) -> QueueService:
#     """Provide QueueService instance."""
#     return get_queue_service(redis_service)

# def provide_phone_service(
#     postgres_service: PostgresService = Depends(provide_postgres_service)
# ) -> PhoneService:
#     """Provide PhoneService instance."""
#     return get_phone_service(postgres_service)

# def provide_captcha_service() -> CaptchaService:
#     """Provide CaptchaService instance."""
#     return get_captcha_service()

# def provide_email_service() -> EmailService:
#     """Provide EmailService instance."""
#     return get_email_service()
