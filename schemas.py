from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime
from backend.models import Category, Status, VoteType, ProofType

class ReportCreate(BaseModel):
    title: str
    description: str
    category_str: str
    detail: Optional[str] = None
    status_str: str = "Draft"

class ReportUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    category_str: Optional[str] = None
    detail: Optional[str] = None
    status_str: Optional[str] = None

class ReportRead(BaseModel):
    id: str
    title: str
    description: str
    category: Category
    detail: Optional[str]
    status: Status
    proof_file: Optional[str]
    proof_type: Optional[ProofType]
    created_at: datetime
    updated_at: datetime

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
    id: int
    created_at: datetime

    class Config:
        orm_mode = True
