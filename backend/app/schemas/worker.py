from pydantic import BaseModel, UUID4, field_validator
import datetime
from typing import Optional

class WorkerCreate(BaseModel):
    name: str

class Worker(WorkerCreate):
    worker_id: UUID4
    registered_at: datetime.datetime
    last_active: Optional[datetime.datetime] = None

    @field_validator('last_active', mode='before')
    @classmethod
    def parse_last_active(cls, v):
        if v == "" or v is None:
            return None
        if isinstance(v, str):
            return datetime.datetime.fromisoformat(v)
        return v

class WorkerRegistrationResponse(Worker):
    worker_token: str