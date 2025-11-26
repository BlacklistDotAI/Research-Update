# Tests Directory

This directory contains all tests for the Blacklist Distributed Task System.

## Directory Structure

```
tests/
├── __init__.py           # Makes tests a package
├── conftest.py           # Shared pytest fixtures
├── test_full_flow.sh     # Bash-based integration test
├── test_full_flow.py     # Python-based integration test
├── unit/                 # Unit tests (fast, isolated)
├── integration/          # Integration tests (API, DB)
└── e2e/                  # End-to-end tests (full workflow)
```

## Running Tests

### All Tests
```bash
pytest
```

### Specific Test File
```bash
pytest tests/test_full_flow.py
```

### By Category
```bash
# Unit tests only
pytest -m unit

# Integration tests
pytest -m integration

# E2E tests
pytest -m e2e

# Exclude slow tests
pytest -m "not slow"
```

### With Coverage
```bash
pytest --cov=app --cov-report=html
```

### Bash Integration Test
```bash
./tests/test_full_flow.sh
```

## Test Categories

### Unit Tests
- Fast, isolated tests
- No external dependencies (Redis, DB, APIs)
- Test individual functions/classes
- Should run in < 1 second each

### Integration Tests
- Test component interactions
- May use Redis, PostgreSQL
- Test API endpoints
- May take several seconds

### E2E Tests
- Test complete workflows
- Use all services (Redis, DB, S3)
- Test user scenarios
- May take minutes

## Writing Tests

### Example Unit Test
```python
import pytest
from app.services.auth_service import verify_password, get_password_hash

@pytest.mark.unit
def test_password_hashing():
    password = "test_password"
    hashed = get_password_hash(password)

    assert verify_password(password, hashed)
    assert not verify_password("wrong_password", hashed)
```

### Example Integration Test
```python
import pytest

@pytest.mark.integration
@pytest.mark.requires_redis
def test_queue_operations(redis_client):
    # Test queue operations
    redis_client.lpush("test:queue", "item1")
    result = redis_client.rpop("test:queue")

    assert result == "item1"
```

### Example API Test
```python
import pytest
import httpx

@pytest.mark.integration
async def test_health_endpoint(base_url):
    async with httpx.AsyncClient() as client:
        response = await client.get(f"{base_url}/health")

        assert response.status_code == 200
        assert response.json()["status"] == "healthy"
```

## Test Fixtures

Common fixtures available in `conftest.py`:
- `settings` - Application settings
- `redis_client` - Redis connection
- `db_session` - Database session
- `admin_credentials` - Default admin credentials
- `mock_turnstile_token` - Mock captcha token
- `sample_task_payload` - Sample task data
- `base_url` - API base URL
- `api_v1_url` - API v1 URL

## Environment Variables

Set these for testing:
```bash
# Use test database
export POSTGRES_DB=blacklist_test

# Use test Redis
export REDIS_URL=redis://:password@localhost:6379/1

# API endpoint
export TEST_BASE_URL=http://localhost:8000
```

## CI/CD Integration

### GitHub Actions Example
```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest

    services:
      redis:
        image: redis:8-alpine
        ports:
          - 6379:6379
      postgres:
        image: postgres:17-alpine
        env:
          POSTGRES_PASSWORD: test
        ports:
          - 5432:5432

    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-python@v4
        with:
          python-version: '3.12'

      - name: Install dependencies
        run: pip install -r requirements.txt pytest pytest-cov

      - name: Run tests
        run: pytest --cov=app --cov-report=xml

      - name: Upload coverage
        uses: codecov/codecov-action@v3
```

## Best Practices

1. **Test Isolation**: Each test should be independent
2. **Fixtures**: Use fixtures for common setup
3. **Markers**: Mark tests by category
4. **Cleanup**: Clean up test data after tests
5. **Mocking**: Mock external services (S3, Turnstile)
6. **Fast Tests**: Keep unit tests fast (< 1s each)
7. **Meaningful Names**: Use descriptive test names
8. **Assertions**: One logical assertion per test
9. **Documentation**: Comment complex test logic
10. **Coverage**: Aim for >80% code coverage

## Common Issues

### Redis Connection Error
```
Solution: Ensure Redis is running on configured port
Check: redis-cli ping
```

### PostgreSQL Connection Error
```
Solution: Ensure PostgreSQL is running and accepting connections
Check: psql -h localhost -U postgres -d blacklist_test
```

### Import Errors
```
Solution: Ensure PYTHONPATH includes project root
Run from project root: pytest
```

## Additional Tools

### Install Testing Tools
```bash
pip install pytest pytest-cov pytest-asyncio pytest-timeout httpx
```

### Generate Coverage Report
```bash
pytest --cov=app --cov-report=html
open htmlcov/index.html
```

### Run with Debugging
```bash
pytest -vv --pdb  # Drop into debugger on failure
```

### Parallel Testing
```bash
pip install pytest-xdist
pytest -n auto  # Run tests in parallel
```
