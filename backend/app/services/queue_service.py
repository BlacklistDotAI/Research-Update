# app/services/queue_service.py
"""
QueueService - Handles distributed task queue operations with Redis.
Refactored to class-based service with dependency injection.
"""
import json
import time
import datetime
from typing import Optional, Dict, Any
from datetime import timezone

from app.core.config import get_settings
from app.services.redis_service import RedisService

settings = get_settings()
TASK_TIMEOUT = settings.TASK_TIMEOUT_SECONDS


class QueueService:
    """
    Service class for distributed task queue operations.
    Manages task lifecycle: enqueue, process, complete, fail, retry.
    """
    
    def __init__(self, redis_service: RedisService):
        """
        Initialize QueueService.
        
        Args:
            redis_service: RedisService instance for queue operations
        """
        self.redis = redis_service
    
    # ============================================================================
    # TASK ENQUEUE
    # ============================================================================
    
    def enqueue_task(
        self, 
        task_id: str, 
        payload: dict, 
        email_notify: Optional[str] = None, 
        eta: Optional[int] = None, 
        expires: Optional[datetime.datetime] = None
    ) -> None:
        """
        Enqueue a new task to the pending queue.
        
        Args:
            task_id: Unique task identifier
            payload: Task payload data
            email_notify: Optional email for notifications
            eta: Estimated time to completion in seconds
            expires: Task expiration datetime
        """
        task_key = f"task:{task_id}"
        task_data = {
            "task_id": task_id,
            "status": "PENDING",
            "payload": json.dumps(payload),
            "created_at": datetime.datetime.now(timezone.utc).isoformat(),
            "retries": "0",
            "traceback": "",
            "worker_id": "",
            "eta": eta or settings.AVG_WAIT_TIME_SECONDS,
            "expires": expires.isoformat() if expires else "",
            "email_notify": email_notify or "none"
        }
        
        pipe = self.redis.pipeline(transaction=True)
        pipe.hset(task_key, mapping=task_data)
        pipe.lpush("queue:pending", task_id)
        pipe.execute()
    
    # ============================================================================
    # TASK LIFECYCLE
    # ============================================================================
    
    def start_processing(self, task_id: str, worker_id: str) -> None:
        """
        Mark task as started/processing.
        
        Args:
            task_id: Task identifier
            worker_id: Worker identifier
        """
        start_time = time.time()
        pipe = self.redis.pipeline(transaction=True)
        pipe.zadd("queue:processing", {task_id: start_time})
        pipe.hset(
            f"task:{task_id}", 
            mapping={
                "status": "STARTED", 
                "started_at": datetime.datetime.now(timezone.utc).isoformat(), 
                "worker_id": worker_id
            }
        )
        pipe.execute()
    
    def complete_task(self, task_id: str, result: dict) -> None:
        """
        Mark task as completed successfully.
        
        Args:
            task_id: Task identifier
            result: Task result data
        """
        pipe = self.redis.pipeline(transaction=True)
        pipe.zrem("queue:processing", task_id)
        pipe.hset(
            f"task:{task_id}", 
            mapping={
                "status": "SUCCESS",
                "result": json.dumps(result),
                "completed_at": datetime.datetime.now(timezone.utc).isoformat()
            }
        )
        pipe.execute()
    
    def fail_task(self, task_id: str, traceback: str) -> None:
        """
        Mark task as failed.
        
        Args:
            task_id: Task identifier
            traceback: Error traceback
        """
        retries = int(self.redis.hget(f"task:{task_id}", "retries") or 0) + 1
        
        pipe = self.redis.pipeline(transaction=True)
        pipe.zrem("queue:processing", task_id)
        pipe.zadd("queue:failed", {task_id: time.time()})
        pipe.hset(
            f"task:{task_id}", 
            mapping={
                "status": "FAILURE",
                "traceback": traceback,
                "retries": str(retries)
            }
        )
        pipe.execute()
    
    def retry_task(self, task_id: str) -> None:
        """
        Move task back to pending for retry.
        
        Args:
            task_id: Task identifier
        """
        pipe = self.redis.pipeline(transaction=True)
        pipe.zrem("queue:processing", task_id)
        pipe.lpush("queue:pending", task_id)
        pipe.hset(f"task:{task_id}", "status", "RETRY")
        pipe.execute()
    
    # ============================================================================
    # TASK QUERIES
    # ============================================================================
    
    def get_task_data(self, task_id: str) -> Optional[Dict[str, Any]]:
        """
        Get task data from Redis.
        
        Args:
            task_id: Task identifier
            
        Returns:
            dict: Task data or None if not found
        """
        return self.redis.hgetall(f"task:{task_id}")
    
    def get_next_pending_task(self) -> Optional[str]:
        """
        Get next pending task ID from queue.
        
        Returns:
            str: Task ID or None if queue is empty
        """
        return self.redis.rpop("queue:pending")
        
    def list_tasks(self, limit: int = 20, status: Optional[str] = None) -> Dict[str, Any]:
        """
        List tasks from queues.
        Note: Redis is not optimized for pagination on lists/sets combined with hash lookups.
        This is a simplified implementation for the admin dashboard.
        
        Args:
            limit: Max number of tasks to return
            status: Filter by status (pending, processing, failed, completed)
            
        Returns:
            dict: {"items": [], "total": 0}
        """
        task_ids = []
        
        if status == "pending":
            task_ids = self.redis.lrange("queue:pending", 0, limit - 1)
        elif status == "processing":
            task_ids = self.redis.zrange("queue:processing", 0, limit - 1)
        elif status == "failed":
            task_ids = self.redis.zrange("queue:failed", 0, limit - 1)
        else:
            # If no status, just get recent ones from all (simplified)
            # In a real app, we might want a separate sorted set for "all tasks by time"
            # For now, let's prioritize failed -> processing -> pending
            failed = self.redis.zrange("queue:failed", 0, limit - 1)
            processing = self.redis.zrange("queue:processing", 0, limit - 1)
            pending = self.redis.lrange("queue:pending", 0, limit - 1)
            task_ids = (failed + processing + pending)[:limit]
            
        items = []
        for tid in task_ids:
            data = self.redis.hgetall(f"task:{tid}")
            if data:
                items.append(data)
                
        return {"items": items, "total": len(items)} # Total is approximate/limited here
    
    # ============================================================================
    # QUEUE MANAGEMENT
    # ============================================================================
    
    def requeue_task(self, task_id: str) -> None:
        """
        Move failed task back to pending queue.
        
        Args:
            task_id: Task identifier
        """
        pipe = self.redis.pipeline(transaction=True)
        pipe.zrem("queue:failed", task_id)
        pipe.lpush("queue:pending", task_id)
        pipe.hset(f"task:{task_id}", "status", "PENDING")
        pipe.execute()
    
    def requeue_all_failed(self) -> int:
        """
        Requeue all failed tasks.
        
        Returns:
            int: Number of tasks requeued
        """
        failed = self.redis.zrange("queue:failed", 0, -1)
        for task_id in failed:
            self.requeue_task(task_id)
        return len(failed)
    
    # ============================================================================
    # STATISTICS
    # ============================================================================
    
    def get_queue_stats(self) -> Dict[str, int]:
        """
        Get queue statistics.
        
        Returns:
            dict: Queue statistics (pending, processing, failed counts)
        """
        return {
            "pending": self.redis.llen("queue:pending"),
            "processing": self.redis.zcard("queue:processing"),
            "failed": self.redis.zcard("queue:failed")
        }


# ============================================================================
# DEPENDENCY INJECTION
# ============================================================================

_queue_service: Optional[QueueService] = None


def get_queue_service(redis_service: Optional[RedisService] = None) -> QueueService:
    """
    Get singleton QueueService instance.
    
    Args:
        redis_service: Optional RedisService instance
        
    Returns:
        QueueService: Singleton service instance
    """
    global _queue_service
    if _queue_service is None:
        from app.services.redis_service import get_redis_service
        redis_service = redis_service or get_redis_service()
        _queue_service = QueueService(redis_service)
    return _queue_service


# ============================================================================
# BACKWARD COMPATIBILITY
# ============================================================================

def enqueue_task(*args, **kwargs):
    """Backward compatibility wrapper."""
    return get_queue_service().enqueue_task(*args, **kwargs)


def start_processing(*args, **kwargs):
    """Backward compatibility wrapper."""
    return get_queue_service().start_processing(*args, **kwargs)


def complete_task(*args, **kwargs):
    """Backward compatibility wrapper."""
    return get_queue_service().complete_task(*args, **kwargs)


def move_to_failed(task_id: str, traceback: str):
    """Backward compatibility wrapper."""
    return get_queue_service().fail_task(task_id, traceback)


def move_to_retry(task_id: str):
    """Backward compatibility wrapper."""
    return get_queue_service().retry_task(task_id)


def requeue_task(task_id: str):
    """Backward compatibility wrapper."""
    return get_queue_service().requeue_task(task_id)


def requeue_all_failed():
    """Backward compatibility wrapper."""
    return get_queue_service().requeue_all_failed()