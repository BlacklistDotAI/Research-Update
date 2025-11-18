from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime
from backend.models import Category, Status, VoteType

class ReportCreate(BaseModel):
    title: str
    description: str
    category: Category
    detail: Optional[str] = None
    status: Status = Status.Draft
    evidence_url: Optional[str] = None
    created_by: Optional[str] = None

class ReportUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    category: Optional[Category] = None
    detail: Optional[str] = None
    status: Optional[Status] = None
    evidence_url: Optional[str] = None
    edited_by: Optional[str] = None


class ReportRead(ReportCreate):
    id: str
    created_at: datetime
    updated_at: datetime
    task_id: Optional[str] = None
    presigned_url: Optional[str] = None
    object_path: Optional[str] = None
    jwt_token: Optional[str] = None
    queue_position: Optional[int] = None

    class Config:
        orm_mode = True

class VoteCreate(BaseModel):
    user_id: str
    report_id: str
    vote_type: VoteType

class VoteRead(VoteCreate):
    id: int
    created_at: datetime

    class Config:
        orm_mode = True
        
class DonateCreate(BaseModel):
    name: str
    email: EmailStr         
    amount: float
    method: str
    message: Optional[str] = None

class DonateRead(DonateCreate):
    id: str
    created_at: datetime

    class Config:
        orm_mode = True
