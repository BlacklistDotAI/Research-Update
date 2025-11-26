#!/usr/bin/env python3
"""
Integration test for worker API concurrency.
Tests multiple workers polling and processing tasks simultaneously.
"""
import asyncio
import httpx
import time
from typing import List
import sys

# Configuration
SERVER_URL = "http://localhost:8000"
WORKER_TOKEN = "your_worker_token_here"  # Replace with actual token
NUM_WORKERS = 10
NUM_TASKS = 50

class WorkerSimulator:
    """Simulates a worker polling and processing tasks."""
    
    def __init__(self, worker_id: str, token: str, server_url: str):
        self.worker_id = worker_id
        self.token = token
        self.server_url = server_url
        self.headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        }
        self.tasks_processed = []
        self.errors = []
    
    async def poll_and_process(self):
        """Poll for tasks and process them."""
        async with httpx.AsyncClient(timeout=30) as client:
            while True:
                try:
                    # Poll for next task
                    response = await client.get(
                        f"{self.server_url}/api/v1/worker/tasks/next",
                        headers=self.headers
                    )
                    
                    if response.status_code == 204:
                        # No tasks available
                        print(f"[{self.worker_id}] No tasks available, stopping")
                        break
                    
                    response.raise_for_status()
                    task = response.json()
                    task_id = task["task_id"]
                    
                    print(f"[{self.worker_id}] Got task: {task_id}")
                    self.tasks_processed.append(task_id)
                    
                    # Simulate processing
                    await asyncio.sleep(0.1)
                    
                    # Complete task
                    complete_response = await client.post(
                        f"{self.server_url}/api/v1/worker/tasks/{task_id}/complete",
                        headers=self.headers,
                        json={"result": {"worker_id": self.worker_id, "status": "success"}}
                    )
                    complete_response.raise_for_status()
                    
                    print(f"[{self.worker_id}] Completed task: {task_id}")
                    
                except httpx.HTTPStatusError as e:
                    if e.response.status_code != 204:
                        error_msg = f"HTTP {e.response.status_code}: {e.response.text}"
                        print(f"[{self.worker_id}] Error: {error_msg}")
                        self.errors.append(error_msg)
                        break
                except Exception as e:
                    error_msg = f"{type(e).__name__}: {str(e)}"
                    print(f"[{self.worker_id}] Error: {error_msg}")
                    self.errors.append(error_msg)
                    break


async def create_test_tasks(num_tasks: int, admin_token: str):
    """Create test tasks via admin API."""
    print(f"\n📝 Creating {num_tasks} test tasks...")
    
    async with httpx.AsyncClient(timeout=30) as client:
        for i in range(num_tasks):
            try:
                response = await client.post(
                    f"{SERVER_URL}/api/v1/tasks",
                    headers={
                        "Authorization": f"Bearer {admin_token}",
                        "Content-Type": "application/json"
                    },
                    json={
                        "phone_number": f"+1234567{i:04d}",
                        "audio_url": f"https://example.com/audio_{i}.mp3"
                    }
                )
                response.raise_for_status()
                if (i + 1) % 10 == 0:
                    print(f"  Created {i + 1}/{num_tasks} tasks")
            except Exception as e:
                print(f"  Error creating task {i}: {e}")
                return False
    
    print(f"✅ Created {num_tasks} tasks successfully\n")
    return True


async def run_concurrent_workers(num_workers: int, worker_token: str):
    """Run multiple workers concurrently."""
    print(f"\n🚀 Starting {num_workers} concurrent workers...\n")
    
    workers = [
        WorkerSimulator(f"test-worker-{i:02d}", worker_token, SERVER_URL)
        for i in range(num_workers)
    ]
    
    start_time = time.time()
    
    # Run all workers concurrently
    await asyncio.gather(*[worker.poll_and_process() for worker in workers])
    
    elapsed_time = time.time() - start_time
    
    return workers, elapsed_time


def analyze_results(workers: List[WorkerSimulator], elapsed_time: float):
    """Analyze test results."""
    print("\n" + "="*60)
    print("📊 TEST RESULTS")
    print("="*60)
    
    all_tasks = []
    total_errors = 0
    
    for worker in workers:
        all_tasks.extend(worker.tasks_processed)
        total_errors += len(worker.errors)
        print(f"{worker.worker_id}: {len(worker.tasks_processed)} tasks, {len(worker.errors)} errors")
    
    print("\n" + "-"*60)
    print(f"Total tasks processed: {len(all_tasks)}")
    print(f"Total errors: {total_errors}")
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
    
    if duplicates > 0:
        print("❌ FAILED: Tasks were processed multiple times!")
        print("   This indicates a race condition in task assignment.")
        return False
    else:
        print("✅ PASSED: No duplicate task processing detected")
    
    if total_errors > 0:
        print(f"\n⚠️  WARNING: {total_errors} errors occurred during processing")
        for worker in workers:
            if worker.errors:
                print(f"  {worker.worker_id}: {worker.errors}")
        return False
    else:
        print("✅ PASSED: No errors during processing")
    
    print("\n" + "="*60)
    print("✅ ALL TESTS PASSED - Worker API is concurrency-safe!")
    print("="*60)
    return True


async def main():
    """Main test function."""
    print("\n" + "="*60)
    print("🧪 WORKER API CONCURRENCY TEST")
    print("="*60)
    
    if len(sys.argv) < 3:
        print("\nUsage: python test_worker_concurrency.py <admin_token> <worker_token>")
        print("\nGet tokens from:")
        print("  - Admin token: Login to admin panel")
        print("  - Worker token: Register worker in admin panel")
        sys.exit(1)
    
    admin_token = sys.argv[1]
    worker_token = sys.argv[2]
    
    # Step 1: Create test tasks
    success = await create_test_tasks(NUM_TASKS, admin_token)
    if not success:
        print("❌ Failed to create test tasks")
        sys.exit(1)
    
    # Step 2: Run concurrent workers
    workers, elapsed_time = await run_concurrent_workers(NUM_WORKERS, worker_token)
    
    # Step 3: Analyze results
    success = analyze_results(workers, elapsed_time)
    
    if success:
        sys.exit(0)
    else:
        sys.exit(1)


if __name__ == "__main__":
    asyncio.run(main())
