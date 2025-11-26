# app/api/v1/client_phone.py (mới)
from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session
from app.core.postgres_client import get_db
from app.schemas.phone import PhoneReportCreate, PhoneReportResponse
from app.services.phone_service import create_report
from slowapi import Limiter
from slowapi.util import get_remote_address
from app.core.config import get_settings
from app.core.rate_limit import get_client_identifier


settings = get_settings()
limiter = Limiter(key_func=get_client_identifier) # Per-IP rate limiting

router = APIRouter(prefix="/client", tags=["phone-report"])

@router.post("/phones/report", response_model=PhoneReportResponse, status_code=201)
@limiter.limit(settings.API_RATE_LIMIT, key_func=get_client_identifier)
async def report_phone(request: Request, report: PhoneReportCreate, db: Session = Depends(get_db)):
    """
    Người dùng report số điện thoại thủ công
    """
    new_report = create_report(db, report.phone_number, report.report_type, report.reported_by_email)
    return new_report