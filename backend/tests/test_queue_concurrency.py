#!/usr/bin/env python3
"""
Simplified worker concurrency test - tests Redis queue operations directly.
This verifies the core concurrency safety without needing a running server.
"""
import sys
import time
import asyncio
from concurrent.futures import ThreadPoolExecutor
from typing import List

# Add parent directory to path
sys.path.insert(0, '/Users/hoangviet/project/blacklist/blacklist-python-be')

from app.core.redis_client import get_redis
from app.services.queue_service import get_queue_service

# Test configuration
NUM_WORKERS = 10
NUM_TASKS = 50

def create_test_tasks(num_tasks: int):
    """Create test tasks in Redis."""
    print(f"\n📝 Creating {num_tasks} test tasks...")
    queue_service = get_queue_service()
    
    for i in range(num_tasks):
        task_id = f"test-task-{i:04d}"
        payload = {
            "phone_number": f"+1234567{i:04d}",
            "audio_url": f"https://example.com/audio_{i}.mp3"
        }
        queue_service.enqueue_task(task_id, payload)
    
    print(f"✅ Created {num_tasks} tasks\n")

def worker_process_tasks(worker_id: str) -> List[str]:
    """Simulate a worker processing tasks."""
    queue_service = get_queue_service()
    processed_tasks = []
    
    print(f"[{worker_id}] Starting...")
    
    while True:
        # Poll for next task
        task_id = queue_service.get_next_pending_task()
        
        if not task_id:
            # No more tasks
            print(f"[{worker_id}] No more tasks, stopping")
            break
        
        print(f"[{worker_id}] Got task: {task_id}")
        processed_tasks.append(task_id)
        
        # Mark as processing
        queue_service.start_processing(task_id, worker_id)
        
        # Simulate processing time
        time.sleep(0.01)
        
        # Complete task
        result = {"worker_id": worker_id, "status": "success"}
        queue_service.complete_task(task_id, result)
        
        print(f"[{worker_id}] Completed: {task_id}")
    
    print(f"[{worker_id}] Finished - processed {len(processed_tasks)} tasks")
    return processed_tasks

def run_concurrent_workers(num_workers: int) -> List[List[str]]:
    """Run multiple workers concurrently using threads."""
    print(f"\n🚀 Starting {num_workers} concurrent workers...\n")
    
    start_time = time.time()
    
    with ThreadPoolExecutor(max_workers=num_workers) as executor:
        futures = [
            executor.submit(worker_process_tasks, f"worker-{i:02d}")
            for i in range(num_workers)
        ]
        
        results = [future.result() for future in futures]
    
    elapsed_time = time.time() - start_time
    
    return results, elapsed_time

def analyze_results(results: List[List[str]], elapsed_time: float, num_tasks: int):
    """Analyze test results."""
    print("\n" + "="*60)
    print("📊 TEST RESULTS")
    print("="*60)
    
    all_tasks = []
    for i, worker_tasks in enumerate(results):
        all_tasks.extend(worker_tasks)
        print(f"worker-{i:02d}: {len(worker_tasks)} tasks")
    
    print("\n" + "-"*60)
    print(f"Total tasks processed: {len(all_tasks)}")
    print(f"Expected tasks: {num_tasks}")
    print(f"Elapsed time: {elapsed_time:.2f}s")
    print(f"Throughput: {len(all_tasks)/elapsed_time:.2f} tasks/sec")
    
    # Check for duplicates
    unique_tasks = set(all_tasks)
    duplicates = len(all_tasks) - len(unique_tasks)
    
    print("\n" + "-"*60)
    print("🔍 CONCURRENCY CHECK")
    print("-"*60)
    print(f"Unique tasks: {len(unique_tasks)}")
    print(f"Duplicate tasks: {duplicates}")
    print(f"Missing tasks: {num_tasks - len(unique_tasks)}")
    
    success = True
    
    if duplicates > 0:
        print("\n❌ FAILED: Tasks were processed multiple times!")
        print("   This indicates a race condition in task assignment.")
        
        # Find which tasks were duplicated
        from collections import Counter
        task_counts = Counter(all_tasks)
        duplicated = {task: count for task, count in task_counts.items() if count > 1}
        print(f"\n   Duplicated tasks: {duplicated}")
        success = False
    else:
        print("✅ PASSED: No duplicate task processing detected")
    
    if len(unique_tasks) != num_tasks:
        print(f"\n⚠️  WARNING: Expected {num_tasks} tasks but got {len(unique_tasks)}")
        success = False
    else:
        print("✅ PASSED: All tasks processed exactly once")
    
    if success:
        print("\n" + "="*60)
        print("✅ ALL TESTS PASSED - Queue operations are concurrency-safe!")
        print("="*60)
    else:
        print("\n" + "="*60)
        print("❌ TESTS FAILED - Concurrency issues detected!")
        print("="*60)
    
    return success

def cleanup_redis():
    """Clean up test data from Redis."""
    print("\n🧹 Cleaning up Redis...")
    r = get_redis()
    
    # Delete test tasks
    for key in r.scan_iter("task:test-task-*"):
        r.delete(key)
    
    # Clear queues
    r.delete("queue:pending")
    r.delete("queue:processing")
    r.delete("queue:failed")
    
    print("✅ Cleanup complete\n")

def main():
    """Main test function."""
    print("\n" + "="*60)
    print("🧪 REDIS QUEUE CONCURRENCY TEST")
    print("="*60)
    print("\nThis test verifies that multiple workers can safely")
    print("poll and process tasks concurrently without race conditions.")
    
    try:
        # Cleanup any previous test data
        cleanup_redis()
        
        # Create test tasks
        create_test_tasks(NUM_TASKS)
        
        # Run concurrent workers
        results, elapsed_time = run_concurrent_workers(NUM_WORKERS)
        
        # Analyze results
        success = analyze_results(results, elapsed_time, NUM_TASKS)
        
        # Cleanup
        cleanup_redis()
        
        if success:
            sys.exit(0)
        else:
            sys.exit(1)
            
    except Exception as e:
        print(f"\n❌ Test failed with error: {e}")
        import traceback
        traceback.print_exc()
        cleanup_redis()
        sys.exit(1)

if __name__ == "__main__":
    main()
