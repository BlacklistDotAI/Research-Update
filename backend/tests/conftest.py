"""
Pytest configuration and shared fixtures

This file contains test fixtures that are available to all tests.
"""

import pytest
import os
from typing import Generator
from redis import Redis
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

# Import app components
from app.core.config import get_settings
from app.core.postgres_client import Base


@pytest.fixture(scope="session")
def settings():
    """Get application settings"""
    return get_settings()


@pytest.fixture(scope="session")
def redis_client(settings) -> Generator[Redis, None, None]:
    """
    Provide Redis client for testing

    Mark tests using this fixture with @pytest.mark.requires_redis
    """
    client = Redis.from_url(settings.REDIS_URL, decode_responses=True)

    # Test connection
    try:
        client.ping()
    except Exception as e:
        pytest.skip(f"Redis not available: {e}")

    yield client

    # Cleanup - flush test keys (be careful!)
    # client.flushdb()


@pytest.fixture(scope="function")
def db_session(settings) -> Generator[Session, None, None]:
    """
    Provide database session for testing

    Creates a new session for each test and rolls back after.
    Mark tests using this fixture with @pytest.mark.requires_postgres
    """
    engine = create_engine(settings.POSTGRES_URL)
    SessionLocal = sessionmaker(bind=engine)

    # Test connection
    try:
        connection = engine.connect()
        connection.close()
    except Exception as e:
        pytest.skip(f"PostgreSQL not available: {e}")

    session = SessionLocal()

    yield session

    # Rollback any changes made during test
    session.rollback()
    session.close()


@pytest.fixture
def admin_credentials():
    """Default admin credentials for testing"""
    return {
        "username": "admin",
        "password": "default_password_change_me"
    }


@pytest.fixture
def mock_turnstile_token():
    """Mock Cloudflare Turnstile token for testing"""
    return "MOCK_TOKEN_FOR_TESTING"


@pytest.fixture
def sample_task_payload():
    """Sample task payload for testing"""
    return {
        "voice_url": "https://example.com/test_voice.mp3",
        "phone_number": "+84123456789"
    }


@pytest.fixture(scope="session")
def base_url():
    """Base URL for API testing"""
    return os.getenv("TEST_BASE_URL", "http://localhost:8000")


@pytest.fixture(scope="session")
def api_v1_url(base_url):
    """API v1 base URL"""
    return f"{base_url}/api/v1"


# Markers for skipping tests based on availability
def pytest_configure(config):
    """Configure custom markers"""
    config.addinivalue_line(
        "markers", "requires_redis: mark test as requiring Redis"
    )
    config.addinivalue_line(
        "markers", "requires_postgres: mark test as requiring PostgreSQL"
    )
    config.addinivalue_line(
        "markers", "requires_s3: mark test as requiring S3/R2"
    )
