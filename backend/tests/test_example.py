"""
Example tests showing different test types and patterns
"""

import pytest
from app.services.auth_service import verify_password, get_password_hash


# ============================================================================
# UNIT TESTS - Fast, isolated, no external dependencies
# ============================================================================

@pytest.mark.unit
class TestPasswordFunctions:
    """Test password hashing and verification"""
    
    def test_password_hashing(self):
        """Test that password hashing works correctly"""
        password = "secure_password_123"
        hashed = get_password_hash(password)
        
        # Password should be hashed (not plain text)
        assert hashed != password
        assert len(hashed) > 50  # Bcrypt hashes are long
        
    def test_password_verification_success(self):
        """Test that correct password verification succeeds"""
        password = "test_password"
        hashed = get_password_hash(password)
        
        assert verify_password(password, hashed) is True
        
    def test_password_verification_failure(self):
        """Test that incorrect password verification fails"""
        password = "correct_password"
        hashed = get_password_hash(password)
        
        assert verify_password("wrong_password", hashed) is False


# ============================================================================
# INTEGRATION TESTS - Test component interactions
# ============================================================================

@pytest.mark.integration
@pytest.mark.requires_redis
class TestRedisQueue:
    """Test Redis queue operations"""
    
    def test_queue_push_pop(self, redis_client):
        """Test basic queue operations"""
        queue_key = "test:queue"
        
        # Clean up first
        redis_client.delete(queue_key)
        
        # Push items
        redis_client.lpush(queue_key, "task1", "task2", "task3")
        
        # Check length
        assert redis_client.llen(queue_key) == 3
        
        # Pop items (FIFO)
        assert redis_client.rpop(queue_key) == "task1"
        assert redis_client.rpop(queue_key) == "task2"
        assert redis_client.llen(queue_key) == 1
        
        # Cleanup
        redis_client.delete(queue_key)


# ============================================================================
# API TESTS - Test HTTP endpoints
# ============================================================================

@pytest.mark.integration
class TestHealthEndpoint:
    """Test health check endpoint"""
    
    @pytest.mark.asyncio
    async def test_health_check(self, base_url):
        """Test that health endpoint returns correct response"""
        import httpx
        
        async with httpx.AsyncClient() as client:
            response = await client.get(f"{base_url}/health")
            
            assert response.status_code == 200
            
            data = response.json()
            assert data["status"] == "healthy"
            assert "Blacklist" in data["service"]
            assert "version" in data


# ============================================================================
# SLOW TESTS - Tests that take longer to run
# ============================================================================

@pytest.mark.slow
@pytest.mark.e2e
class TestCompleteWorkflow:
    """End-to-end workflow tests"""
    
    @pytest.mark.asyncio
    async def test_admin_login_workflow(self, base_url, admin_credentials):
        """Test complete admin login workflow"""
        import httpx
        
        async with httpx.AsyncClient() as client:
            # Try to login
            response = await client.post(
                f"{base_url}/api/v1/admin/login",
                data={
                    "username": admin_credentials["username"],
                    "password": admin_credentials["password"]
                }
            )
            
            # Should succeed or fail gracefully
            assert response.status_code in [200, 401]
            
            if response.status_code == 200:
                data = response.json()
                assert "access_token" in data
                assert "refresh_token" in data


# ============================================================================
# PARAMETRIZED TESTS - Run same test with different inputs
# ============================================================================

@pytest.mark.unit
@pytest.mark.parametrize("password,expected_valid", [
    ("short", True),  # Even short passwords should hash
    ("medium_length_password", True),
    ("very_long_password_with_many_characters_123456", True),
    ("", True),  # Even empty string should hash
])
def test_password_hashing_various_lengths(password, expected_valid):
    """Test password hashing with various password lengths"""
    hashed = get_password_hash(password)
    
    assert len(hashed) > 0
    assert verify_password(password, hashed) is expected_valid


# ============================================================================
# SKIP/XFAIL TESTS - Tests with conditions
# ============================================================================

@pytest.mark.skip(reason="Feature not yet implemented")
def test_future_feature():
    """Test for a feature that doesn't exist yet"""
    pass


@pytest.mark.xfail(reason="Known bug, will fix later")
def test_known_bug():
    """Test that currently fails but we know about it"""
    assert False, "This is expected to fail"


# ============================================================================
# FIXTURES IN ACTION
# ============================================================================

@pytest.mark.unit
def test_using_fixtures(admin_credentials, sample_task_payload):
    """Example of using multiple fixtures"""
    # admin_credentials fixture provides default credentials
    assert admin_credentials["username"] == "admin"
    
    # sample_task_payload fixture provides sample task data
    assert "voice_url" in sample_task_payload
    assert "phone_number" in sample_task_payload


# ============================================================================
# To run these tests:
# ============================================================================
# pytest tests/test_example.py                    # Run all
# pytest tests/test_example.py -k password        # Run tests with "password" in name
# pytest tests/test_example.py -m unit            # Run only unit tests
# pytest tests/test_example.py -m "not slow"      # Skip slow tests
# pytest tests/test_example.py -v                 # Verbose output
# pytest tests/test_example.py --pdb              # Debug on failure
