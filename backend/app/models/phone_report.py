# app/models/phone_report.py (SQLAlchemy model)
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Enum, Text
from sqlalchemy.sql import func
from app.core.postgres_client import Base
import enum

class ReportType(enum.Enum):
    scam = "scam"
    spam = "spam"
    harassment = "harassment"
    other = "other"

class ReportStatus(enum.Enum):
    pending = "pending"
    approved = "approved"
    rejected = "rejected"

class PhoneReport(Base):
    __tablename__ = "phone_reports"

    id = Column(Integer, primary_key=True, index=True)
    phone_number = Column(String(20), index=True, nullable=False)
    report_type = Column(Enum(ReportType), nullable=False)
    status = Column(Enum(ReportStatus), default=ReportStatus.pending)
    count = Column(Integer, default=1)
    notes = Column(Text, nullable=True)  # Lý do admin reject
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    task_id = Column(String, nullable=True)  # Nếu từ voice task
    reported_by_email = Column(String, nullable=True)  # Nếu user nhập email khi report
