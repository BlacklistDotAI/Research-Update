# app/api/v1/client_tasks.py
from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel, EmailStr
from redis import Redis
import uuid
import json
import datetime
from typing import Optional
from app.core.redis_client import get_redis
from app.schemas.task import Task
from app.services.queue_service import enqueue_task
from app.core.config import get_settings
from slowapi import Limiter
from app.core.rate_limit import get_client_identifier

settings = get_settings()
AVG_WAIT_TIME = settings.AVG_WAIT_TIME_SECONDS or 30  # seconds per task
limiter = Limiter(key_func=get_client_identifier)  # Per-IP rate limiting.

class TaskCreatePayload(BaseModel):
    voice_url: str
    phone_number: Optional[str] = None
    # other fields if needed

class TaskWithCaptcha(BaseModel):
    payload: TaskCreatePayload
    email_notify: Optional[EmailStr] = None
    turnstile_token: str  # Cloudflare Turnstile token from frontend

router = APIRouter(prefix="/client", tags=["tasks"])

@router.get("/tasks/{task_id}", response_model=Task)
@limiter.limit(settings.API_RATE_LIMIT, key_func=get_client_identifier)
async def get_task_status(task_id: str, request: Request, r: Redis = Depends(get_redis)):
    """
    Get task status and result

    Returns the current status and result of a task by its ID.
    Can be used to poll for task completion.
    """
    from fastapi import HTTPException, status

    task_data = r.hgetall(f"task:{task_id}")
    if not task_data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found"
        )

    # Parse the task data
    try:
        parsed_data = {
            "task_id": uuid.UUID(task_id),
            "status": task_data.get("status", "PENDING"),
            "payload": json.loads(task_data.get("payload", "{}")),
            "result": json.loads(task_data.get("result", "{}")) if task_data.get("result") else None,
            "traceback": task_data.get("traceback", ""),
            "retries": int(task_data.get("retries", 0)),
            "worker_id": task_data.get("worker_id", ""),
            "created_at": datetime.datetime.fromisoformat(task_data["created_at"]),
            "started_at": datetime.datetime.fromisoformat(task_data["started_at"]) if task_data.get("started_at") else None,
            "completed_at": datetime.datetime.fromisoformat(task_data["completed_at"]) if task_data.get("completed_at") else None,
            "email_notify": task_data.get("email_notify") if task_data.get("email_notify") != "none" else None,
        }

        # Calculate queue position if still pending
        if parsed_data["status"] == "PENDING":
            pending_tasks = r.lrange("queue:pending", 0, -1)
            if task_id in pending_tasks:
                queue_position = pending_tasks.index(task_id) + 1
                parsed_data["eta"] = queue_position * AVG_WAIT_TIME

        return Task(**parsed_data)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to parse task data: {str(e)}"
        )

@router.post("/tasks", response_model=Task, status_code=201) # Assuming TaskSubmitResponse is meant to be Task, or needs to be imported/defined. Keeping Task for now.
@limiter.limit(settings.API_RATE_LIMIT, key_func=get_client_identifier)
async def submit_task(request: Request, task: TaskWithCaptcha, r: Redis = Depends(get_redis)):
    """
    Submit a new task

    Creates and enqueues a new task for processing. Requires Cloudflare Turnstile
    verification to prevent spam.

    Returns the created task with queue position and estimated processing time.
    """
    try:
        # 1. Verify Turnstile (FREE anti-spam)
        await verify_turnstile(task.turnstile_token)

        # 2. Generate task_id
        task_id = str(uuid.uuid4())

        # 3. Calculate queue position & estimated time
        pending = r.llen("queue:pending")
        processing = r.zcard("queue:processing")
        queue_position = pending + processing + 1
        estimated_time_seconds = queue_position * AVG_WAIT_TIME

        # 4. Enqueue task
        enqueue_task(
            task_id=task_id,
            payload=task.payload.dict(),
            email_notify=task.email_notify
        )

        # 5. Prepare response
        task_data = r.hgetall(f"task:{task_id}")
        task_data["payload"] = json.loads(task_data["payload"])
        task_data["task_id"] = uuid.UUID(task_id)
        task_data["created_at"] = datetime.datetime.fromisoformat(task_data["created_at"])
        task_data["queue_position"] = queue_position
        task_data["estimated_time_seconds"] = estimated_time_seconds

        return Task(**task_data)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to create task: {str(e)}"
        )