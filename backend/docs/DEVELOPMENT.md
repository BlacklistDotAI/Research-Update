# Development Guide

Complete guide for setting up and developing the Blacklist system locally.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Initial Setup](#initial-setup)
3. [Running Locally](#running-locally)
4. [Project Structure](#project-structure)
5. [Code Style](#code-style)
6. [Testing](#testing)
7. [Debugging](#debugging)
8. [Common Tasks](#common-tasks)

---

## Prerequisites

### Required Software

- **Python 3.11+**
- **Docker & Docker Compose** (for local services)
- **PostgreSQL 14+** (via Docker or local)
- **Redis 7+** (via Docker or local)
- **Git**

### Optional Tools

- **PyCharm** or **VS Code**
- **Postman** or **Insomnia** (API testing)
- **DBeaver** or **pgAdmin** (database GUI)
- **Redis Commander** (Redis GUI)

---

## Initial Setup

### 1. Clone Repository

```bash
git clone https://github.com/yourorg/blacklist-system.git
cd blacklist-system
```

### 2. Create Virtual Environment

```bash
# Create venv
python3 -m venv venv

# Activate
source venv/bin/activate  # Linux/Mac
# OR
venv\Scripts\activate  # Windows
```

### 3. Install Dependencies

```bash
pip install -r requirements.txt

# Install development dependencies
pip install pytest pytest-asyncio pytest-cov black flake8 mypy
```

### 4. Configure Environment

```bash
# Copy example environment file
cp .env.example .env

# Edit with your values
nano .env
```

**Minimal Development Configuration:**

```bash
# Environment
ENVIRONMENT=development
DEBUG=true

# Redis (Docker)
REDIS_URL=redis://:password@localhost:6379/0

# Postgres (Docker)
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_USER=postgres
POSTGRES_PASSWORD=devpassword
POSTGRES_DB=blacklist

# JWT (development secrets)
ADMIN_JWT_SECRET_KEY=dev_admin_secret_key_change_in_production
WORKER_JWT_SECRET_KEY=dev_worker_secret_key_change_in_production
JWT_ALGORITHM=HS256

# CORS (allow all in dev)
CORS_ORIGINS=*
CORS_ALLOW_CREDENTIALS=true

# Security (relaxed for dev)
ALLOWED_HOSTS=*
API_RATE_LIMIT=1000/minute
ADMIN_RATE_LIMIT=500/minute

# Cloudflare Turnstile (use test keys)
CLOUDFLARE_TURNSTILE_SITE_KEY=1x00000000000000000000AA
CLOUDFLARE_TURNSTILE_SECRET_KEY=1x0000000000000000000000000000000AA

# S3 (optional for local dev)
S3_ENDPOINT_URL=http://localhost:9000
S3_ACCESS_KEY_ID=minioadmin
S3_SECRET_ACCESS_KEY=minioadmin
S3_BUCKET_NAME=blacklist-dev
S3_REGION=us-east-1
```

### 5. Start Services with Docker

```bash
# Start PostgreSQL and Redis
docker-compose up -d postgres redis

# Optional: MinIO for S3 testing
docker-compose up -d minio
```

### 6. Initialize Database

```bash
# Run migrations
alembic upgrade head

# Create initial admin
curl -X POST http://localhost:8000/api/v1/admin/seed
```

---

## Running Locally

### Start Server

```bash
# Activate venv
source venv/bin/activate

# Run server with auto-reload
python server.py

# OR with uvicorn directly
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Server will be available at:
- **API:** http://localhost:8000
- **API Docs:** http://localhost:8000/docs
- **ReDoc:** http://localhost:8000/redoc

### Start Worker

```bash
# In another terminal
source venv/bin/activate

# First, register a worker via API
# (see Quick Start below)

# Then run worker
export WORKER_TOKEN=<your_worker_token>
python worker/worker.py
```

### Start Janitor (Zombie Task Recovery)

```bash
# In another terminal
source venv/bin/activate
python janitor/janitor.py
```

### Quick Start Script

```bash
#!/bin/bash
# dev-start.sh

# Start services
docker-compose up -d postgres redis

# Wait for services
sleep 3

# Run migrations
alembic upgrade head

# Start server in background
python server.py &
SERVER_PID=$!

# Wait for server to start
sleep 2

# Create admin
curl -X POST http://localhost:8000/api/v1/admin/seed

# Login
TOKEN=$(curl -X POST http://localhost:8000/api/v1/admin/login \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=admin&password=default_password_change_me" \
  | jq -r .access_token)

# Register worker
WORKER_TOKEN=$(curl -X POST http://localhost:8000/api/v1/admin/workers \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "worker-dev-01"}' \
  | jq -r .worker_token)

echo "Worker token: $WORKER_TOKEN"

# Start worker
export WORKER_TOKEN=$WORKER_TOKEN
python worker/worker.py &
WORKER_PID=$!

echo "Server PID: $SERVER_PID"
echo "Worker PID: $WORKER_PID"
echo "Visit http://localhost:8000/docs"
```

Make executable and run:

```bash
chmod +x dev-start.sh
./dev-start.sh
```

---

## Project Structure

```
blacklist-python-be/
├── app/
│   ├── api/
│   │   └── v1/
│   │       ├── admin_auth.py          # Admin authentication
│   │       ├── admin_tasks.py         # Admin task management
│   │       ├── admin_workers.py       # Worker registration
│   │       ├── admin_phones.py        # Phone report moderation
│   │       ├── client_tasks.py        # Public task submission
│   │       ├── client_uploads.py      # File upload URLs
│   │       └── client_phone.py        # Public phone reporting
│   ├── core/
│   │   ├── config.py                  # Settings & configuration
│   │   ├── redis_client.py            # Redis connection
│   │   ├── postgres_client.py         # PostgreSQL connection
│   │   ├── security.py                # Security utilities
│   │   └── captcha.py                 # Turnstile validation
│   ├── models/
│   │   ├── admin.py                   # Admin SQLAlchemy model
│   │   ├── worker.py                  # Worker SQLAlchemy model
│   │   ├── task.py                    # Task SQLAlchemy model
│   │   └── phone_report.py            # PhoneReport SQLAlchemy model
│   ├── schemas/
│   │   ├── admin.py                   # Admin Pydantic schemas
│   │   ├── worker.py                  # Worker Pydantic schemas
│   │   ├── task.py                    # Task Pydantic schemas
│   │   └── phone.py                   # Phone report Pydantic schemas
│   ├── services/
│   │   ├── auth_service.py            # Authentication logic
│   │   ├── queue_service.py           # Task queue operations
│   │   ├── phone_service.py           # Phone report logic
│   │   ├── email_service.py           # Email notifications
│   │   └── storage_service.py         # S3 presigned URLs
│   ├── templates/
│   │   └── email/
│   │       └── task_complete.html     # Email template
│   └── main.py                        # FastAPI app initialization
├── worker/
│   └── worker.py                      # Worker daemon
├── janitor/
│   └── janitor.py                     # Zombie task recovery
├── migrations/
│   ├── versions/
│   │   └── 0001_init_full.py         # Initial migration
│   ├── env.py                         # Alembic environment
│   └── alembic.ini                    # Alembic config
├── tests/
│   ├── conftest.py                    # Pytest fixtures
│   ├── test_example.py                # Unit tests
│   ├── test_full_flow.py              # Integration tests
│   └── test_full_flow.sh              # Bash integration tests
├── docs/                              # Documentation
├── server.py                          # Server entry point
├── docker-compose.yml                 # Development services
├── requirements.txt                   # Python dependencies
└── .env.example                       # Environment template
```

### Key Files Explained

**`server.py`**: Application entry point with middleware setup

**`app/main.py`**: FastAPI app initialization and router inclusion

**`app/core/config.py`**: Centralized configuration using Pydantic settings

**`app/services/queue_service.py`**: Core queue logic (enqueue, dequeue, retry, stats)

**`worker/worker.py`**: Worker that polls Redis queue and processes tasks

**`janitor/janitor.py`**: Background process that recovers stuck tasks

---

## Code Style

### Python Style Guide

Follow **PEP 8** with these tools:

```bash
# Auto-format code
black app/ worker/ janitor/ tests/

# Check style
flake8 app/ worker/ janitor/ tests/

# Type checking
mypy app/
```

### Code Formatting Rules

```python
# Imports order
import standard_library
import third_party
from app.module import something

# Type hints
def function_name(param: str, optional: Optional[int] = None) -> dict:
    """Docstring explaining function"""
    pass

# F-strings for formatting
message = f"Task {task_id} completed"

# Constants in UPPER_CASE
MAX_RETRIES = 3
DEFAULT_TIMEOUT = 300
```

### Pre-commit Hook

Create `.git/hooks/pre-commit`:

```bash
#!/bin/bash
black --check app/ worker/ janitor/
flake8 app/ worker/ janitor/
pytest tests/test_example.py
```

Make executable:

```bash
chmod +x .git/hooks/pre-commit
```

---

## Testing

See [TESTING.md](./TESTING.md) for complete testing guide.

### Quick Test Commands

```bash
# Run all tests
pytest

# Run specific test file
pytest tests/test_example.py

# Run with coverage
pytest --cov=app --cov-report=html

# Run integration tests
python tests/test_full_flow.py
./tests/test_full_flow.sh

# Run single test
pytest tests/test_example.py::test_health_check
```

---

## Debugging

### VS Code Configuration

Create `.vscode/launch.json`:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "FastAPI Server",
      "type": "python",
      "request": "launch",
      "program": "${workspaceFolder}/server.py",
      "console": "integratedTerminal",
      "env": {
        "PYTHONPATH": "${workspaceFolder}"
      }
    },
    {
      "name": "Worker",
      "type": "python",
      "request": "launch",
      "program": "${workspaceFolder}/worker/worker.py",
      "console": "integratedTerminal",
      "env": {
        "WORKER_TOKEN": "your_worker_token_here",
        "PYTHONPATH": "${workspaceFolder}"
      }
    },
    {
      "name": "Pytest",
      "type": "python",
      "request": "launch",
      "module": "pytest",
      "args": ["-v"],
      "console": "integratedTerminal"
    }
  ]
}
```

### Debug Print Helper

```python
# app/core/debug.py
import json
from typing import Any

def debug_print(label: str, data: Any):
    """Pretty print for debugging"""
    print(f"\n{'='*50}")
    print(f"DEBUG: {label}")
    print(f"{'='*50}")
    print(json.dumps(data, indent=2, default=str))
    print(f"{'='*50}\n")
```

Usage:

```python
from app.core.debug import debug_print

debug_print("Task Data", task_data)
debug_print("Queue Stats", queue_stats)
```

### Common Debugging Scenarios

#### Check Redis Keys

```bash
redis-cli -h localhost -p 6379 -a password

# List all keys
KEYS *

# Check queue
LRANGE queue:pending 0 -1

# Check task
HGETALL task:123e4567-e89b-12d3-a456-426614174000

# Check stats
HGETALL queue:stats
```

#### Check Database State

```bash
psql -U postgres -d blacklist

# Check tables
\dt

# Check admins
SELECT * FROM admins;

# Check workers
SELECT worker_id, name, is_active, last_active FROM workers;

# Check tasks
SELECT task_id, status, created_at FROM tasks ORDER BY created_at DESC LIMIT 10;

# Check phone reports
SELECT phone_number, report_type, status, created_at FROM phone_reports;
```

#### API Request Logging

Add to `server.py`:

```python
import logging

logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

@app.middleware("http")
async def log_requests(request: Request, call_next):
    logger.info(f"Request: {request.method} {request.url}")
    logger.debug(f"Headers: {request.headers}")
    response = await call_next(request)
    logger.info(f"Response: {response.status_code}")
    return response
```

---

## Common Tasks

### Add New Endpoint

1. **Create endpoint in appropriate router:**

```python
# app/api/v1/client_tasks.py
@router.get("/tasks/search")
async def search_tasks(
    query: str,
    r: Redis = Depends(get_redis)
):
    """Search tasks by criteria"""
    # Implementation
    return {"results": [...]}
```

2. **Add tests:**

```python
# tests/test_client_tasks.py
def test_search_tasks(client):
    response = client.get("/api/v1/client/tasks/search?query=test")
    assert response.status_code == 200
```

3. **Update API documentation in code**

### Add New Database Model

1. **Create SQLAlchemy model:**

```python
# app/models/notification.py
from app.core.postgres_client import Base
from sqlalchemy import Column, Integer, String, DateTime

class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, nullable=False)
    message = Column(String(500))
    created_at = Column(DateTime, server_default=func.now())
```

2. **Create Pydantic schemas:**

```python
# app/schemas/notification.py
from pydantic import BaseModel
from datetime import datetime

class NotificationCreate(BaseModel):
    user_id: int
    message: str

class Notification(NotificationCreate):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True
```

3. **Generate migration:**

```bash
alembic revision --autogenerate -m "Add notifications table"
alembic upgrade head
```

### Add New Service

1. **Create service file:**

```python
# app/services/notification_service.py
from sqlalchemy.orm import Session
from app.models.notification import Notification

def create_notification(db: Session, user_id: int, message: str):
    notification = Notification(user_id=user_id, message=message)
    db.add(notification)
    db.commit()
    db.refresh(notification)
    return notification
```

2. **Use in endpoints:**

```python
from app.services.notification_service import create_notification

@router.post("/notify")
async def send_notification(
    user_id: int,
    message: str,
    db: Session = Depends(get_db)
):
    notification = create_notification(db, user_id, message)
    return notification
```

### Update Dependencies

```bash
# Update all packages
pip install --upgrade -r requirements.txt

# Update specific package
pip install --upgrade fastapi

# Freeze new versions
pip freeze > requirements.txt

# Check for security vulnerabilities
pip install safety
safety check
```

---

## Development Workflow

### Feature Development

1. **Create feature branch:**
   ```bash
   git checkout -b feature/task-priority
   ```

2. **Develop and test:**
   ```bash
   # Make changes
   # Run tests
   pytest
   ```

3. **Format and lint:**
   ```bash
   black app/
   flake8 app/
   ```

4. **Commit changes:**
   ```bash
   git add .
   git commit -m "Add task priority feature"
   ```

5. **Push and create PR:**
   ```bash
   git push origin feature/task-priority
   ```

### Database Changes

1. **Update models**
2. **Generate migration:**
   ```bash
   alembic revision --autogenerate -m "description"
   ```
3. **Review migration file**
4. **Test migration:**
   ```bash
   alembic upgrade head
   alembic downgrade -1
   alembic upgrade head
   ```
5. **Commit migration file**

---

## Troubleshooting

### Port Already in Use

```bash
# Find process using port 8000
lsof -i :8000

# Kill process
kill -9 <PID>
```

### Database Connection Error

```bash
# Check PostgreSQL is running
docker ps | grep postgres

# Check connection
psql -U postgres -h localhost -d blacklist

# Reset database (development only!)
docker-compose down -v
docker-compose up -d postgres
alembic upgrade head
```

### Redis Connection Error

```bash
# Check Redis is running
docker ps | grep redis

# Test connection
redis-cli -h localhost -p 6379 -a password ping
```

### Import Errors

```bash
# Verify PYTHONPATH
echo $PYTHONPATH

# Set PYTHONPATH
export PYTHONPATH="${PYTHONPATH}:$(pwd)"

# Or add to .env
PYTHONPATH=/path/to/project
```

---

## Resources

- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [SQLAlchemy Documentation](https://docs.sqlalchemy.org/)
- [Alembic Documentation](https://alembic.sqlalchemy.org/)
- [Pydantic Documentation](https://docs.pydantic.dev/)
- [Redis Documentation](https://redis.io/documentation)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)

---

**Last Updated:** 2024-11-19
