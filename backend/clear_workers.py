
import asyncio
from app.core.redis_client import get_redis
from app.core.config import get_settings

async def clear_test_workers():
    print("Connecting to Redis...")
    # get_redis returns the client directly, not a generator
    r = get_redis()
    
    print("Scanning for test workers...")
    count = 0
    # Scan for keys starting with worker:test-worker
    # Note: The keys in Redis are likely "worker:<uuid>", but the *name* inside the hash is "test-worker-...".
    # The API lists all "worker:*".
    
    # Let's find all workers and check their names
    for key in r.scan_iter("worker:*"):
        data = r.hgetall(key)
        name = data.get("name", "")
        if "test-worker" in name:
            print(f"Deleting worker: {name} (Key: {key})")
            r.delete(key)
            count += 1
            
    print(f"Cleared {count} test workers.")

if __name__ == "__main__":
    asyncio.run(clear_test_workers())
