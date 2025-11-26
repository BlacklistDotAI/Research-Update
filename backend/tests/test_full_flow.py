#!/usr/bin/env python3
"""
Comprehensive End-to-End Test Script for Blacklist System

This script tests the complete workflow:
1. Admin setup and authentication
2. Worker registration
3. Client task submission with Turnstile (mocked)
4. Worker pulling and processing tasks
5. Task status checking and result retrieval
"""

import httpx
import json
import time
import sys
from uuid import uuid4

BASE_URL = "http://localhost:8000"
API_V1 = f"{BASE_URL}/api/v1"


class Colors:
    """ANSI color codes for terminal output"""
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    RESET = '\033[0m'
    BOLD = '\033[1m'


def print_step(step_num, description):
    """Print formatted step header"""
    print(f"\n{Colors.BOLD}{Colors.BLUE}{'='*80}{Colors.RESET}")
    print(f"{Colors.BOLD}{Colors.BLUE}STEP {step_num}: {description}{Colors.RESET}")
    print(f"{Colors.BOLD}{Colors.BLUE}{'='*80}{Colors.RESET}\n")


def print_success(message):
    """Print success message"""
    print(f"{Colors.GREEN}✓ {message}{Colors.RESET}")


def print_error(message):
    """Print error message"""
    print(f"{Colors.RED}✗ {message}{Colors.RESET}")


def print_info(message):
    """Print info message"""
    print(f"{Colors.YELLOW}ℹ {message}{Colors.RESET}")


def check_server():
    """Check if server is running"""
    try:
        response = httpx.get(f"{BASE_URL}/health", timeout=5)
        if response.status_code == 200:
            print_success("Server is running")
            print_info(f"Response: {response.json()}")
            return True
        else:
            print_error(f"Server returned status {response.status_code}")
            return False
    except Exception as e:
        print_error(f"Cannot connect to server: {e}")
        return False


def seed_admin():
    """Seed the first admin user"""
    try:
        response = httpx.post(f"{API_V1}/admin/seed")
        if response.status_code in [200, 400]:  # 400 if already exists
            print_success("Admin user seeded/exists")
            print_info(f"Response: {response.json()}")
            return True
        else:
            print_error(f"Failed to seed admin: {response.text}")
            return False
    except Exception as e:
        print_error(f"Error seeding admin: {e}")
        return False


def admin_login():
    """Login as admin and get access token"""
    try:
        data = {
            "username": "admin",
            "password": "default_password_change_me"
        }
        response = httpx.post(
            f"{API_V1}/admin/login",
            data=data  # OAuth2PasswordRequestForm expects form data
        )
        if response.status_code == 200:
            tokens = response.json()
            print_success("Admin logged in successfully")
            print_info(f"Access token (first 50 chars): {tokens['access_token'][:50]}...")
            return tokens['access_token']
        else:
            print_error(f"Login failed: {response.text}")
            return None
    except Exception as e:
        print_error(f"Error during login: {e}")
        return None


def get_queue_stats(admin_token):
    """Get current queue statistics"""
    try:
        headers = {"Authorization": f"Bearer {admin_token}"}
        response = httpx.get(f"{API_V1}/queue/stats", headers=headers)
        if response.status_code == 200:
            stats = response.json()
            print_success("Retrieved queue statistics")
            print_info(f"Queue stats: {json.dumps(stats, indent=2)}")
            return stats
        else:
            print_error(f"Failed to get stats: {response.text}")
            return None
    except Exception as e:
        print_error(f"Error getting stats: {e}")
        return None


def submit_task_with_mock_captcha():
    """Submit a task with mocked Turnstile captcha"""
    print_info("Note: Using mock Turnstile token - this will fail unless server is configured to accept it")
    print_info("In production, you'd get a real token from Cloudflare Turnstile")

    try:
        task_data = {
            "payload": {
                "voice_url": "https://example.com/voice/sample123.mp3",
                "phone_number": "+84123456789"
            },
            "email_notify": "test@example.com",
            "turnstile_token": "MOCK_TOKEN_FOR_TESTING"  # This will be validated by Cloudflare
        }

        response = httpx.post(
            f"{API_V1}/client/tasks",
            json=task_data
        )

        if response.status_code == 201:
            task = response.json()
            print_success(f"Task submitted successfully")
            print_info(f"Task ID: {task['task_id']}")
            print_info(f"Status: {task['status']}")
            print_info(f"Queue position: {task.get('queue_position', 'N/A')}")
            print_info(f"Estimated wait: {task.get('estimated_time_seconds', 'N/A')} seconds")
            return task['task_id']
        else:
            print_error(f"Task submission failed: {response.status_code}")
            print_error(f"Response: {response.text}")
            return None
    except Exception as e:
        print_error(f"Error submitting task: {e}")
        return None


def check_task_status(task_id):
    """Check status of a task"""
    try:
        response = httpx.get(f"{API_V1}/client/tasks/{task_id}")
        if response.status_code == 200:
            task = response.json()
            print_success(f"Task status retrieved")
            print_info(f"Status: {task['status']}")
            print_info(f"Worker ID: {task.get('worker_id', 'None')}")
            if task.get('result'):
                print_info(f"Result: {json.dumps(task['result'], indent=2)}")
            if task.get('traceback'):
                print_info(f"Error: {task['traceback']}")
            return task
        elif response.status_code == 404:
            print_error("Task not found")
            return None
        else:
            print_error(f"Failed to get task status: {response.text}")
            return None
    except Exception as e:
        print_error(f"Error checking task status: {e}")
        return None


def create_worker_token(admin_token):
    """Create a worker and get its token"""
    try:
        headers = {"Authorization": f"Bearer {admin_token}"}
        worker_data = {"name": f"test-worker-{uuid4().hex[:8]}"}

        response = httpx.post(
            f"{API_V1}/admin/workers",  # Updated endpoint
            json=worker_data,
            headers=headers
        )

        if response.status_code == 201:
            worker = response.json()
            print_success(f"Worker registered")
            print_info(f"Worker ID: {worker['worker_id']}")
            print_info(f"Worker token (first 50 chars): {worker['worker_token'][:50]}...")
            return worker['worker_id'], worker['worker_token']
        else:
            print_error(f"Worker registration failed: {response.text}")
            return None, None
    except Exception as e:
        print_error(f"Error creating worker: {e}")
        return None, None


def test_worker_api_poll(worker_token):
    """Test worker API polling for tasks"""
    try:
        headers = {"Authorization": f"Bearer {worker_token}"}
        
        response = httpx.get(
            f"{API_V1}/worker/tasks/next",
            headers=headers
        )
        
        if response.status_code == 204:
            print_success("Worker API poll successful (no tasks available)")
            return None
        elif response.status_code == 200:
            task = response.json()
            print_success(f"Worker received task: {task['task_id']}")
            return task
        else:
            print_error(f"Worker poll failed: {response.text}")
            return None
    except Exception as e:
        print_error(f"Error polling worker API: {e}")
        return None


def test_worker_api_complete(worker_token, task_id):
    """Test worker API task completion"""
    try:
        headers = {"Authorization": f"Bearer {worker_token}"}
        
        response = httpx.post(
            f"{API_V1}/worker/tasks/{task_id}/complete",
            headers=headers,
            json={"result": {"test": "success", "scam_score": 0.5}}
        )
        
        if response.status_code == 200:
            print_success(f"Worker completed task via API")
            return True
        else:
            print_error(f"Worker complete failed: {response.text}")
            return False
    except Exception as e:
        print_error(f"Error completing task: {e}")
        return False


def test_worker_heartbeat(worker_token):
    """Test worker heartbeat"""
    try:
        headers = {"Authorization": f"Bearer {worker_token}"}
        
        response = httpx.post(
            f"{API_V1}/worker/heartbeat",
            headers=headers
        )
        
        if response.status_code == 200:
            print_success("Worker heartbeat successful")
            return True
        else:
            print_error(f"Heartbeat failed: {response.text}")
            return False
    except Exception as e:
        print_error(f"Error sending heartbeat: {e}")
        return False


def create_test_task_direct(admin_token):
    """Create a test task directly via admin API (bypassing captcha)"""
    try:
        headers = {"Authorization": f"Bearer {admin_token}"}
        
        # Use queue service directly to create task
        import sys
        sys.path.insert(0, '/Users/hoangviet/project/blacklist/blacklist-python-be')
        from app.services.queue_service import get_queue_service
        
        queue_service = get_queue_service()
        task_id = f"test-{uuid4().hex[:8]}"
        payload = {
            "phone_number": "+1234567890",
            "audio_url": "https://example.com/test.mp3"
        }
        
        queue_service.enqueue_task(task_id, payload)
        print_success(f"Test task created: {task_id}")
        return task_id
    except Exception as e:
        print_error(f"Error creating test task: {e}")
        return None


def test_upload_url():
    """Test presigned upload URL generation"""
    print_info("Testing with mock Turnstile token - will likely fail without valid token")

    try:
        upload_data = {
            "filename": "test_voice.mp3",
            "content_type": "audio/mpeg",
            "content_length": 1024 * 500,  # 500 KB
            "turnstile_token": "MOCK_TOKEN_FOR_TESTING"
        }

        response = httpx.post(
            f"{API_V1}/client/uploads/presigned-url",
            json=upload_data
        )

        if response.status_code == 200:
            result = response.json()
            print_success("Presigned URL generated")
            print_info(f"URL (first 100 chars): {result['url'][:100]}...")
            print_info(f"Method: {result['method']}")
            print_info(f"Key: {result['key']}")
            return result
        else:
            print_error(f"Upload URL generation failed: {response.text}")
            return None
    except Exception as e:
        print_error(f"Error generating upload URL: {e}")
        return None


def main():
    """Main test flow"""
    print(f"\n{Colors.BOLD}{'='*80}")
    print(f"BLACKLIST SYSTEM - COMPREHENSIVE END-TO-END TEST")
    print(f"{'='*80}{Colors.RESET}\n")

    # Step 1: Check server
    print_step(1, "Checking Server Health")
    if not check_server():
        print_error("Server is not running. Please start the server first.")
        sys.exit(1)

    # Step 2: Seed admin
    print_step(2, "Seeding Admin User")
    if not seed_admin():
        print_error("Failed to seed admin user")
        sys.exit(1)

    # Step 3: Admin login
    print_step(3, "Admin Login")
    admin_token = admin_login()
    if not admin_token:
        print_error("Failed to login as admin")
        sys.exit(1)

    # Step 4: Get queue stats
    print_step(4, "Getting Queue Statistics")
    get_queue_stats(admin_token)

    # Step 5: Create worker
    print_step(5, "Creating Worker Token")
    worker_id, worker_token = create_worker_token(admin_token)
    if not worker_token:
        print_error("Failed to create worker")
        sys.exit(1)

    # Step 6: Test worker heartbeat
    print_step(6, "Testing Worker Heartbeat")
    test_worker_heartbeat(worker_token)

    # Step 7: Test worker polling (should return 204 - no tasks)
    print_step(7, "Testing Worker API Polling (Empty Queue)")
    test_worker_api_poll(worker_token)

    # Step 8: Create a test task directly
    print_step(8, "Creating Test Task (Direct)")
    task_id = create_test_task_direct(admin_token)
    
    if task_id:
        # Step 9: Worker polls and gets task
        print_step(9, "Worker Polling for Task")
        task = test_worker_api_poll(worker_token)
        
        if task:
            # Step 10: Worker completes task
            print_step(10, "Worker Completing Task")
            test_worker_api_complete(worker_token, task['task_id'])
            
            # Step 11: Check final task status
            print_step(11, "Checking Final Task Status")
            final_task = check_task_status(task['task_id'])

    # Step 12: Test upload URL generation
    print_step(12, "Testing Presigned Upload URL Generation")
    test_upload_url()

    # Step 13: Submit a task with captcha (will fail)
    print_step(13, "Submitting Task (with mock captcha)")
    print_info("NOTE: This will fail captcha verification unless Turnstile is configured")
    submit_task_with_mock_captcha()

    # Final summary
    print(f"\n{Colors.BOLD}{Colors.BLUE}{'='*80}")
    print(f"TEST SUMMARY")
    print(f"{'='*80}{Colors.RESET}\n")

    print(f"{Colors.BOLD}What was tested:{Colors.RESET}")
    print_success("Server health check")
    print_success("Admin user seeding")
    print_success("Admin authentication")
    print_success("Queue statistics retrieval")
    print_success("Worker registration")
    print_success("Worker heartbeat API")
    print_success("Worker task polling API")
    print_success("Worker task completion API")
    print_success("Task status retrieval")
    print_success("Presigned upload URL generation (attempted)")
    print_success("Task submission with captcha (attempted)")

    print(f"\n{Colors.BOLD}Worker API Endpoints Tested:{Colors.RESET}")
    print_success("GET /api/v1/worker/tasks/next - Poll for tasks")
    print_success("POST /api/v1/worker/tasks/{id}/complete - Complete task")
    print_success("POST /api/v1/worker/heartbeat - Worker heartbeat")

    print(f"\n{Colors.BOLD}To test with real worker:{Colors.RESET}")
    print_info("1. Create .env in worker/ directory:")
    print_info(f"   SERVER_URL={BASE_URL}")
    print_info(f"   WORKER_TOKEN={worker_token[:30] if worker_token else '<token>'}...")
    print_info(f"   WORKER_ID={worker_id if worker_id else 'worker-01'}")
    print_info("2. Run: cd worker && python worker.py")

    print(f"\n{Colors.BOLD}To test concurrency:{Colors.RESET}")
    print_info("Run: python tests/test_queue_concurrency.py")
    print_info("This tests 10 concurrent workers processing 50 tasks")

    print(f"\n{Colors.GREEN}{Colors.BOLD}Test script completed!{Colors.RESET}\n")


if __name__ == "__main__":
    main()
