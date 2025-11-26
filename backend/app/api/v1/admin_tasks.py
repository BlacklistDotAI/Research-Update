# app/api/v1/admin_tasks.py
from fastapi import APIRouter, Depends, HTTPException, status
from redis import Redis
from app.core.redis_client import get_redis
from app.services.auth_service import get_current_admin
from app.schemas.user import AdminUser
from app.services.queue_service import requeue_all_failed, requeue_task

router = APIRouter(prefix="/admin", tags=["admin-tasks"])

@router.get("/tasks")
async def list_tasks(
    limit: int = 20,
    status: str = None,
    admin: AdminUser = Depends(get_current_admin),
    r: Redis = Depends(get_redis)
):
    """
    List tasks from the queue.
    """
    from app.services.queue_service import get_queue_service
    queue_service = get_queue_service()
    return queue_service.list_tasks(limit=limit, status=status)

@router.get("/queue/stats")
async def queue_stats(
    admin: AdminUser = Depends(get_current_admin),
    r: Redis = Depends(get_redis)
):
    """
    Get queue statistics

    Returns the count of tasks in pending, processing, and failed queues.
    Requires admin authentication.
    """
    try:
        pipe = r.pipeline()
        pipe.llen("queue:pending")
        pipe.zcard("queue:processing")
        pipe.zcard("queue:failed")
        res = pipe.execute()
        return {
            "pending": res[0],
            "processing": res[1],
            "failed": res[2]
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch queue stats: {str(e)}"
        )

@router.post("/tasks/retry-all-failed")
async def retry_all(admin: AdminUser = Depends(get_current_admin)):
    """
    Retry all failed tasks

    Requeues all tasks from the failed queue back to pending.
    Requires admin authentication.
    """
    try:
        count = requeue_all_failed()
        return {"requeued": count, "message": f"Successfully requeued {count} tasks"}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to requeue tasks: {str(e)}"
        )

@router.post("/tasks/{task_id}/retry")
async def retry_one(
    task_id: str,
    admin: AdminUser = Depends(get_current_admin),
    r: Redis = Depends(get_redis)
):
    """
    Retry a specific failed task

    Requeues a single task from the failed queue back to pending.
    Requires admin authentication.
    """
    if not r.zscore("queue:failed", task_id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found in failed queue"
        )
    try:
        requeue_task(task_id)
        return {"message": "Task requeued successfully", "task_id": task_id}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to requeue task: {str(e)}"
        )