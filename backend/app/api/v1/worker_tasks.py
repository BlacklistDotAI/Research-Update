"""
Worker API endpoints - For standalone workers to communicate with server.
Workers poll for tasks, update status, and submit results via HTTP API.
"""
from fastapi import APIRouter, Depends, HTTPException, status, Header
from typing import Optional, Dict, Any
from pydantic import BaseModel
import datetime
from datetime import timezone
import json

from app.core.redis_client import get_redis
from app.services.queue_service import get_queue_service
from app.core.config import get_settings
from jose import JWTError, jwt

router = APIRouter(prefix="/worker", tags=["worker"])
settings = get_settings()


# ============================================================================
# REQUEST/RESPONSE MODELS
# ============================================================================

class TaskResponse(BaseModel):
    """Task data returned to worker."""
    task_id: str
    payload: Dict[str, Any]
    created_at: str
    eta: int


class StatusUpdateRequest(BaseModel):
    """Request to update task status."""
    status: str


class CompleteTaskRequest(BaseModel):
    """Request to mark task as completed."""
    result: Dict[str, Any]


class FailTaskRequest(BaseModel):
    """Request to mark task as failed."""
    error: str


# ============================================================================
# AUTHENTICATION HELPER
# ============================================================================

def verify_worker_token(authorization: str = Header(...)) -> tuple[str, str]:
    """
    Verify worker JWT token and return worker info.
    
    Returns:
        tuple: (worker_id, worker_name)
    """
    if not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authorization header",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    token = authorization.replace("Bearer ", "")
    
    try:
        payload = jwt.decode(
            token,
            settings.WORKER_JWT_SECRET_KEY,
            algorithms=[settings.JWT_ALGORITHM],
            options={"verify_exp": False}  # Worker tokens don't expire
        )
        worker_id: str = payload.get("sub")
        
        if not worker_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token payload"
            )
        
        # Get worker info from Redis
        r = get_redis()
        worker_data = r.hgetall(f"worker:{worker_id}")
        
        if not worker_data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Worker not found"
            )
        
        return worker_id, worker_data.get("name", "Unknown")
        
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )


# ============================================================================
# WORKER ENDPOINTS
# ============================================================================

@router.get("/tasks/next")
async def get_next_task(worker_info: tuple = Depends(verify_worker_token)):
    """
    Poll for next available task.
    Returns 204 No Content if no tasks available.
    """
    worker_id, worker_name = worker_info
    queue_service = get_queue_service()
    
    task_id = queue_service.get_next_pending_task()
    
    if not task_id:
        # No tasks available
        raise HTTPException(status_code=status.HTTP_204_NO_CONTENT)
    
    # Get task data
    task_data = queue_service.get_task_data(task_id)
    if not task_data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")
    
    # Mark as started
    queue_service.start_processing(task_id, worker_id)
    
    # Parse payload
    payload = json.loads(task_data.get("payload", "{}"))
    
    return {
        "task_id": task_id,
        "payload": payload,
        "created_at": task_data.get("created_at", ""),
        "eta": int(task_data.get("eta", 30))
    }


@router.patch("/tasks/{task_id}/status")
async def update_task_status(
    task_id: str,
    request: StatusUpdateRequest,
    worker_info: tuple = Depends(verify_worker_token)
):
    """Update task status."""
    worker_id, worker_name = worker_info
    queue_service = get_queue_service()
    
    task_data = queue_service.get_task_data(task_id)
    if not task_data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")
    
    # Update status in Redis
    r = get_redis()
    r.hset(f"task:{task_id}", "status", request.status)
    
    return {"message": "Status updated", "task_id": task_id, "status": request.status}


@router.post("/tasks/{task_id}/complete")
async def complete_task(
    task_id: str,
    request: CompleteTaskRequest,
    worker_info: tuple = Depends(verify_worker_token)
):
    """Mark task as completed with result."""
    worker_id, worker_name = worker_info
    queue_service = get_queue_service()
    
    task_data = queue_service.get_task_data(task_id)
    if not task_data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")
    
    # Complete task
    queue_service.complete_task(task_id, request.result)
    
    return {"message": "Task completed", "task_id": task_id}


@router.post("/tasks/{task_id}/fail")
async def fail_task(
    task_id: str,
    request: FailTaskRequest,
    worker_info: tuple = Depends(verify_worker_token)
):
    """Mark task as failed with error message."""
    worker_id, worker_name = worker_info
    queue_service = get_queue_service()
    
    task_data = queue_service.get_task_data(task_id)
    if not task_data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")
    
    # Fail task
    queue_service.fail_task(task_id, request.error)
    
    return {"message": "Task marked as failed", "task_id": task_id}


@router.post("/heartbeat")
async def worker_heartbeat(worker_info: tuple = Depends(verify_worker_token)):
    """
    Worker heartbeat - updates last_active timestamp.
    Workers should send this periodically to mark themselves as active.
    """
    worker_id, worker_name = worker_info
    
    r = get_redis()
    r.hset(
        f"worker:{worker_id}",
        "last_active",
        datetime.datetime.now(timezone.utc).isoformat()
    )
    
    return {"message": "Heartbeat received", "worker_id": worker_id}
