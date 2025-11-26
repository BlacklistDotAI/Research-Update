# Update theo yêu cầu: Giữ thiết kế custom Redis distributed (Redis không public, worker connect qua private network/VPC/URL with auth).
# Học từ Celery: Định nghĩa status giống (PENDING, STARTED, SUCCESS, FAILURE, RETRY), fields giống (task_id, status, result, traceback, retries, args/payload, hostname/worker_id, eta/estimated_time, expires).
# Thêm field: traceback (last_error), retries (retry_count), worker_id (hostname), eta (estimated_time_seconds).

# app/schemas/task.py (update giống Celery)
from pydantic import BaseModel, UUID4, EmailStr
from enum import Enum
import datetime

class TaskStatus(Enum):
    PENDING = "PENDING"   # Chờ xử lý (Celery)
    STARTED = "STARTED"   # Bắt đầu xử lý (Celery)
    SUCCESS = "SUCCESS"   # Thành công (Celery)
    FAILURE = "FAILURE"   # Thất bại (Celery)
    RETRY = "RETRY"       # Đang retry (Celery)

class TaskBase(BaseModel):
    payload: dict  # args/kwargs của Celery

class TaskCreate(TaskBase):
    email_notify: EmailStr | None = None

class Task(TaskBase):
    task_id: UUID4
    status: TaskStatus = TaskStatus.PENDING
    result: dict | None = None
    traceback: str | None = None  # Last error, giống Celery
    retries: int = 0  # Số lần retry, giống Celery
    worker_id: str | None = None  # Hostname của worker, giống Celery
    eta: int | None = None  # Estimated time seconds (giống eta trong Celery)
    expires: datetime.datetime | None = None  # Task expire, giống Celery
    created_at: datetime.datetime
    started_at: datetime.datetime | None = None
    completed_at: datetime.datetime | None = None
    email_notify: EmailStr | None = None

    class Config:
        from_attributes = True