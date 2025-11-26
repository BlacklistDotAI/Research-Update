# janitor/janitor.py
import time
from app.services.queue_service import move_to_failed, TASK_TIMEOUT
from app.core.redis_client import get_redis
from app.core.config import get_settings

settings = get_settings()
r = get_redis()

def janitor_loop():
    print(f"Janitor started – Zombie task hunter (max retries: {settings.MAX_TASK_RETRIES})")
    while True:
        try:
            now = time.time()
            stuck_tasks = r.zrangebyscore("queue:processing", 0, now - TASK_TIMEOUT)
            for task_id in stuck_tasks:
                retry_count = int(r.hget(f"task:{task_id}", "retry_count") or 0)
                if retry_count >= settings.MAX_TASK_RETRIES:
                    move_to_failed(task_id, f"Zombie task – worker died, max retries ({settings.MAX_TASK_RETRIES}) exceeded")
                    print(f"Failed zombie task {task_id} after {retry_count} retries")
                else:
                    # Requeue to pending
                    pipe = r.pipeline(transaction=True)
                    pipe.zrem("queue:processing", task_id)
                    pipe.lpush("queue:pending", task_id)
                    pipe.hincrby(f"task:{task_id}", "retry_count", 1)
                    pipe.hset(f"task:{task_id}", "status", "PENDING")
                    pipe.execute()
                    print(f"Rescued zombie task {task_id} (retry {retry_count + 1}/{settings.MAX_TASK_RETRIES})")
            time.sleep(30)
        except Exception as e:
            print(f"Janitor error: {e}")
            time.sleep(60)

if __name__ == "__main__":
    janitor_loop()