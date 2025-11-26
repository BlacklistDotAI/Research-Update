# app/services/phone_service.py
"""
PhoneService - Handles phone number report operations.
Refactored to class-based service with dependency injection.
"""
from typing import Optional, List, Dict, Tuple
from sqlalchemy.orm import Session
from sqlalchemy.sql import func

from app.models.phone_report import PhoneReport, ReportType, ReportStatus


class PhoneService:
    """
    Service class for phone number report operations.
    Manages phone number reporting, approval, rejection, and statistics.
    """
    
    # ============================================================================
    # REPORT CREATION & UPDATES
    # ============================================================================
    
    def create_report(
        self, 
        db: Session, 
        phone_number: str, 
        report_type: ReportType, 
        email: Optional[str] = None
    ) -> PhoneReport:
        """
        Create or update a phone number report.
        
        Args:
            db: Database session
            phone_number: Phone number to report
            report_type: Type of report
            email: Reporter's email (optional)
            
        Returns:
            PhoneReport: Created or updated report
        """
        # Check if report already exists
        existing = db.query(PhoneReport).filter(
            PhoneReport.phone_number == phone_number
        ).first()
        
        if existing:
            # Increment count for existing report
            existing.count += 1
            existing.updated_at = func.now()
            db.commit()
            db.refresh(existing)
            return existing
        
        # Create new report
        report = PhoneReport(
            phone_number=phone_number, 
            report_type=report_type, 
            reported_by_email=email
        )
        db.add(report)
        db.commit()
        db.refresh(report)
        return report
    
    def approve_report(self, db: Session, report_id: int) -> Optional[PhoneReport]:
        """
        Approve a phone number report.
        
        Args:
            db: Database session
            report_id: Report ID
            
        Returns:
            PhoneReport: Updated report or None if not found
        """
        report = db.query(PhoneReport).filter(PhoneReport.id == report_id).first()
        if report:
            report.status = ReportStatus.approved
            db.commit()
            db.refresh(report)
            return report
        return None
    
    def reject_report(
        self, 
        db: Session, 
        report_id: int, 
        note: str = ""
    ) -> Optional[PhoneReport]:
        """
        Reject a phone number report.
        
        Args:
            db: Database session
            report_id: Report ID
            note: Rejection note
            
        Returns:
            PhoneReport: Updated report or None if not found
        """
        report = db.query(PhoneReport).filter(PhoneReport.id == report_id).first()
        if report:
            report.status = ReportStatus.rejected
            report.notes = note
            db.commit()
            db.refresh(report)
            return report
        return None
    
    def delete_report(self, db: Session, report_id: int) -> bool:
        """
        Delete a phone number report.
        
        Args:
            db: Database session
            report_id: Report ID
            
        Returns:
            bool: True if deleted, False if not found
        """
        report = db.query(PhoneReport).filter(PhoneReport.id == report_id).first()
        if report:
            db.delete(report)
            db.commit()
            return True
        return False
    
    # ============================================================================
    # QUERIES
    # ============================================================================
    
    def list_reports(
        self, 
        db: Session, 
        skip: int = 0, 
        limit: int = 100,
        status: Optional[ReportStatus] = None,
        phone_number: Optional[str] = None
    ) -> Tuple[List[PhoneReport], int]:
        """
        List phone number reports with pagination and filtering.
        
        Args:
            db: Database session
            skip: Number of records to skip
            limit: Max number of records to return
            status: Filter by status
            phone_number: Filter by phone number (partial match)
            
        Returns:
            tuple: (List of reports, Total count)
        """
        query = db.query(PhoneReport)
        
        if status:
            query = query.filter(PhoneReport.status == status)
            
        if phone_number:
            query = query.filter(PhoneReport.phone_number.contains(phone_number))
            
        total = query.count()
        reports = query.order_by(PhoneReport.created_at.desc()).offset(skip).limit(limit).all()
        
        return reports, total
    
    def search_phone_report(self, db: Session, phone_number: str) -> Optional[PhoneReport]:
        """
        Search for a phone number report.
        
        Args:
            db: Database session
            phone_number: Phone number to search
            
        Returns:
            PhoneReport: Report or None if not found
        """
        return db.query(PhoneReport).filter(
            PhoneReport.phone_number == phone_number
        ).first()
    
    def get_stats(self, db: Session) -> Dict[str, int]:
        """
        Get phone report statistics.
        
        Args:
            db: Database session
            
        Returns:
            dict: Statistics (total, approved, rejected, pending counts)
        """
        return {
            "total": db.query(PhoneReport).count(),
            "approved": db.query(PhoneReport).filter(
                PhoneReport.status == ReportStatus.approved
            ).count(),
            "rejected": db.query(PhoneReport).filter(
                PhoneReport.status == ReportStatus.rejected
            ).count(),
            "pending": db.query(PhoneReport).filter(
                PhoneReport.status == ReportStatus.pending
            ).count(),
        }


# ============================================================================
# DEPENDENCY INJECTION
# ============================================================================

_phone_service: Optional[PhoneService] = None


def get_phone_service() -> PhoneService:
    """
    Get singleton PhoneService instance.
    
    Returns:
        PhoneService: Singleton service instance
    """
    global _phone_service
    if _phone_service is None:
        _phone_service = PhoneService()
    return _phone_service


# ============================================================================
# BACKWARD COMPATIBILITY
# ============================================================================

def create_report(db: Session, phone_number: str, report_type: ReportType, email: str = None):
    """Backward compatibility wrapper."""
    return get_phone_service().create_report(db, phone_number, report_type, email)


def list_reports(db: Session, skip: int = 0, limit: int = 100, status: Optional[ReportStatus] = None, phone_number: Optional[str] = None):
    """Backward compatibility wrapper."""
    return get_phone_service().list_reports(db, skip, limit, status, phone_number)


def approve_report(db: Session, report_id: int):
    """Backward compatibility wrapper."""
    return get_phone_service().approve_report(db, report_id)


def reject_report(db: Session, report_id: int, note: str = ""):
    """Backward compatibility wrapper."""
    return get_phone_service().reject_report(db, report_id, note)


def delete_report(db: Session, report_id: int):
    """Backward compatibility wrapper."""
    return get_phone_service().delete_report(db, report_id)


def get_stats(db: Session):
    """Backward compatibility wrapper."""
    return get_phone_service().get_stats(db)


def search_phone_report(db: Session, phone_number: str):
    """Backward compatibility wrapper."""
    return get_phone_service().search_phone_report(db, phone_number)