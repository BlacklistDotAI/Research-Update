from pydantic import BaseModel, EmailStr, UUID4,Field
from enum import Enum
from typing import Optional
from datetime import datetime, timezone
from app.models.report import (
    Category, Status, ProofType,
)
class ReportCreate(BaseModel):
    title: str = Field(...,max_length=20,description="Report Title")
    description: str = Field(description="Report Description")
    category: Category = Field(...,description="Category of report") 
    detail: Optional[str] = Field(None,description="Category Detail")
    status: Status = Field(description="Report Status")

class ReportRead(BaseModel):
    id: UUID4
    title: str
    description: str
    category: Category
    detail: Optional[str]
    status: Status
    proof_file: Optional[str]
    proof_type: Optional[ProofType]
    created_at: datetime
    updated_at: Optional[datetime]=None

    class Config:
        from_attributes = True
        
class ReportResponse(ReportRead):
    pass
