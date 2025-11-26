from fastapi import APIRouter, Depends, HTTPException
from redis import Redis
import uuid
import datetime
from app.core.redis_client import get_redis
from app.services.auth_service import get_current_admin, create_worker_token, hash_token
from app.schemas.user import AdminUser
from app.schemas.worker import WorkerCreate, WorkerRegistrationResponse, Worker

router = APIRouter(prefix="/admin", tags=["admin-workers"])

@router.post("/workers", response_model=WorkerRegistrationResponse, status_code=201)
async def register_worker(worker_in: WorkerCreate, admin: AdminUser = Depends(get_current_admin), r: Redis = Depends(get_redis)):
    worker_id = str(uuid.uuid4())
    worker_token = create_worker_token(worker_id)
    token_hash = hash_token(worker_token)
    worker_data = {
        "worker_id": worker_id,
        "name": worker_in.name,
        "jwt_hash": token_hash,
        "registered_at": datetime.datetime.now(datetime.timezone.utc).isoformat(),
        "last_active": ""  # Empty string instead of None for Redis
    }
    r.hset(f"worker:{worker_id}", mapping=worker_data)
    return WorkerRegistrationResponse(**worker_data, worker_token=worker_token)

@router.get("/workers", response_model=list[Worker])
async def list_workers(admin: AdminUser = Depends(get_current_admin), r: Redis = Depends(get_redis)):
    workers = []
    for key in r.scan_iter("worker:*"):
        worker_data = r.hgetall(key)
        if worker_data:
            workers.append(Worker(**worker_data))
    return workers

@router.delete("/workers/{worker_id}", status_code=204)
async def revoke_worker(worker_id: str, admin: AdminUser = Depends(get_current_admin), r: Redis = Depends(get_redis)):
    deleted_count = r.delete(f"worker:{worker_id}")
    if deleted_count == 0:
        raise HTTPException(status_code=404, detail="Worker not found")