from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.core.postgres_client import get_db
from app.services.auth_service import get_current_admin
from app.schemas.user import AdminUser
from app.schemas.phone import PhoneReport
from app.services.phone_service import list_reports, approve_report, reject_report, delete_report, get_stats, search_phone_report  # Thêm search

router = APIRouter(prefix="/admin", tags=["admin-phones"])

from typing import Optional
from app.models.phone_report import ReportStatus

@router.get("/phones", response_model=dict)
async def list_phone_reports(
    skip: int = 0,
    limit: int = 20,
    status: Optional[ReportStatus] = None,
    phone_number: Optional[str] = None,
    admin: AdminUser = Depends(get_current_admin), 
    db: Session = Depends(get_db)
):
    items, total = list_reports(db, skip=skip, limit=limit, status=status, phone_number=phone_number)
    return {"items": items, "total": total}

@router.post("/phones/{report_id}/approve", response_model=PhoneReport)
async def approve_phone_report(report_id: int, admin: AdminUser = Depends(get_current_admin), db: Session = Depends(get_db)):
    report = approve_report(db, report_id)
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    return report

@router.post("/phones/{report_id}/reject", response_model=PhoneReport)
async def reject_phone_report(report_id: int, note: str = Query(None), admin: AdminUser = Depends(get_current_admin), db: Session = Depends(get_db)):
    report = reject_report(db, report_id, note)
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    return report

@router.delete("/phones/{report_id}", status_code=204)
async def delete_phone_report(report_id: int, admin: AdminUser = Depends(get_current_admin), db: Session = Depends(get_db)):
    deleted = delete_report(db, report_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Report not found")

@router.get("/phones/stats", response_model=dict)
async def phone_report_stats(admin: AdminUser = Depends(get_current_admin), db: Session = Depends(get_db)):
    return get_stats(db)

# Thêm API search phone (public, cho app query)
@router.get("/phones/search", response_model=PhoneReport | None)
async def search_phone(phone_number: str = Query(...), db: Session = Depends(get_db)):
    """API public để app query sđt có report không"""
    return search_phone_report(db, phone_number)