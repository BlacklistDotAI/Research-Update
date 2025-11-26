# app/schemas/phone.py (Pydantic schemas)
from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional
from enum import Enum

class ReportType(str, Enum):
    scam = "scam"
    spam = "spam"
    harassment = "harassment"
    other = "other"

class ReportStatus(str, Enum):
    pending = "pending"
    approved = "approved"
    rejected = "rejected"

class PhoneReportCreate(BaseModel):
    phone_number: str = Field(..., max_length=20, description="Phone number to report")
    report_type: ReportType = Field(..., description="Type of report")
    notes: Optional[str] = Field(None, description="Additional notes")
    reported_by_email: Optional[str] = Field(None, description="Reporter's email for notifications")

class PhoneReportUpdate(BaseModel):
    status: Optional[ReportStatus] = None
    notes: Optional[str] = None

class PhoneReport(BaseModel):
    id: int
    phone_number: str
    report_type: ReportType
    status: ReportStatus
    count: int
    notes: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    task_id: Optional[str] = None
    reported_by_email: Optional[str] = None

    class Config:
        from_attributes = True

class PhoneReportResponse(PhoneReport):
    """Response model for phone report"""
    pass
