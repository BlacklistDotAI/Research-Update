#!/usr/bin/env python3
"""
Standalone Worker - Communicates with server via HTTP API only.
No direct Redis or database connections.
"""
import os
import sys
import time
import random
import logging
import asyncio
import httpx
from typing import Optional, Dict, Any

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Configuration from environment
SERVER_URL = os.getenv("SERVER_URL", "http://localhost:8000")
WORKER_TOKEN = os.getenv("WORKER_TOKEN")
WORKER_ID = os.getenv("WORKER_ID", "unknown")
POLL_INTERVAL = int(os.getenv("POLL_INTERVAL", "5"))  # seconds
REQUEST_TIMEOUT = int(os.getenv("REQUEST_TIMEOUT", "30"))  # seconds

if not WORKER_TOKEN:
    logger.error("WORKER_TOKEN environment variable is required")
    sys.exit(1)


class WorkerAPIClient:
    """HTTP client for communicating with the server API."""
    
    def __init__(self, server_url: str, token: str):
        self.server_url = server_url.rstrip('/')
        self.token = token
        self.headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        }
    
    async def get_next_task(self) -> Optional[Dict[str, Any]]:
        """Poll server for next available task."""
        try:
            async with httpx.AsyncClient(timeout=REQUEST_TIMEOUT) as client:
                response = await client.get(
                    f"{self.server_url}/api/v1/worker/tasks/next",
                    headers=self.headers
                )
                if response.status_code == 204:  # No tasks available
                    return None
                response.raise_for_status()
                return response.json()
        except httpx.HTTPStatusError as e:
            logger.error(f"HTTP error getting next task: {e.response.status_code}")
            return None
        except Exception as e:
            logger.error(f"Error getting next task: {e}")
            return None
    
    async def update_task_status(self, task_id: str, status: str, **kwargs) -> bool:
        """Update task status on server."""
        try:
            async with httpx.AsyncClient(timeout=REQUEST_TIMEOUT) as client:
                response = await client.patch(
                    f"{self.server_url}/api/v1/worker/tasks/{task_id}/status",
                    headers=self.headers,
                    json={"status": status, **kwargs}
                )
                response.raise_for_status()
                return True
        except Exception as e:
            logger.error(f"Error updating task status: {e}")
            return False
    
    async def complete_task(self, task_id: str, result: Dict[str, Any]) -> bool:
        """Mark task as completed with result."""
        try:
            async with httpx.AsyncClient(timeout=REQUEST_TIMEOUT) as client:
                response = await client.post(
                    f"{self.server_url}/api/v1/worker/tasks/{task_id}/complete",
                    headers=self.headers,
                    json={"result": result}
                )
                response.raise_for_status()
                return True
        except Exception as e:
            logger.error(f"Error completing task: {e}")
            return False
    
    async def fail_task(self, task_id: str, error: str) -> bool:
        """Mark task as failed with error message."""
        try:
            async with httpx.AsyncClient(timeout=REQUEST_TIMEOUT) as client:
                response = await client.post(
                    f"{self.server_url}/api/v1/worker/tasks/{task_id}/fail",
                    headers=self.headers,
                    json={"error": error}
                )
                response.raise_for_status()
                return True
        except Exception as e:
            logger.error(f"Error failing task: {e}")
            return False
    
    async def heartbeat(self) -> bool:
        """Send heartbeat to server to mark worker as active."""
        try:
            async with httpx.AsyncClient(timeout=REQUEST_TIMEOUT) as client:
                response = await client.post(
                    f"{self.server_url}/api/v1/worker/heartbeat",
                    headers=self.headers
                )
                response.raise_for_status()
                return True
        except Exception as e:
            logger.error(f"Error sending heartbeat: {e}")
            return False


async def process_voice_task(payload: Dict[str, Any], task_id: str) -> Dict[str, Any]:
    """
    Process voice scam detection task.
    This is a mock implementation - replace with actual ML model.
    """
    logger.info(f"Processing voice task {task_id}")
    
    # Simulate processing time
    processing_time = random.randint(10, 60)
    await asyncio.sleep(processing_time)
    
    # Mock scam detection result
    scam_score = random.uniform(0, 1)
    risk_level = "HIGH" if scam_score > 0.7 else "MEDIUM" if scam_score > 0.4 else "LOW"
    reasons = ["Suspicious voice pattern", "Scam keywords detected"] if scam_score > 0.5 else ["Normal conversation"]
    
    result = {
        "scam_score": round(scam_score, 3),
        "risk_level": risk_level,
        "reasons": reasons,
        "processing_time_seconds": processing_time,
        "worker_id": WORKER_ID
    }
    
    logger.info(f"Task {task_id} completed with risk level: {risk_level}")
    return result


async def worker_loop():
    """Main worker loop - polls for tasks and processes them."""
    api_client = WorkerAPIClient(SERVER_URL, WORKER_TOKEN)
    
    logger.info(f"Worker {WORKER_ID} started")
    logger.info(f"Server URL: {SERVER_URL}")
    logger.info(f"Poll interval: {POLL_INTERVAL}s")
    
    # Send initial heartbeat
    await api_client.heartbeat()
    
    last_heartbeat = time.time()
    heartbeat_interval = 60  # Send heartbeat every 60 seconds
    
    while True:
        try:
            # Send periodic heartbeat
            if time.time() - last_heartbeat > heartbeat_interval:
                await api_client.heartbeat()
                last_heartbeat = time.time()
            
            # Poll for next task
            task = await api_client.get_next_task()
            
            if not task:
                # No tasks available, wait before polling again
                await asyncio.sleep(POLL_INTERVAL)
                continue
            
            task_id = task.get("task_id")
            payload = task.get("payload", {})
            
            logger.info(f"Received task {task_id}")
            
            # Update status to STARTED
            await api_client.update_task_status(task_id, "STARTED")
            
            try:
                # Process the task
                result = await process_voice_task(payload, task_id)
                
                # Mark as completed
                success = await api_client.complete_task(task_id, result)
                if success:
                    logger.info(f"Task {task_id} completed successfully")
                else:
                    logger.error(f"Failed to mark task {task_id} as completed")
                    
            except Exception as e:
                # Task processing failed
                error_msg = f"{type(e).__name__}: {str(e)}"
                logger.error(f"Task {task_id} failed: {error_msg}")
                await api_client.fail_task(task_id, error_msg)
        
        except KeyboardInterrupt:
            logger.info("Worker shutting down...")
            break
        except Exception as e:
            logger.error(f"Worker loop error: {e}")
            await asyncio.sleep(POLL_INTERVAL)


if __name__ == "__main__":
    try:
        asyncio.run(worker_loop())
    except KeyboardInterrupt:
        logger.info("Worker stopped")