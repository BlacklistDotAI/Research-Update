# app/services/email_service.py
"""
EmailService - Handles email sending operations.
Refactored to class-based service with dependency injection.
"""
import logging
from typing import Optional
from pathlib import Path
from fastapi_mail import FastMail, MessageSchema, ConnectionConfig, MessageType
from pydantic import EmailStr

from app.core.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()


class EmailService:
    """
    Service class for email operations.
    Uses FastAPI-Mail for sending templated emails via SMTP or Resend.
    """
    
    def __init__(self):
        """Initialize EmailService with mail configuration."""
        # Check if we have the required email settings
        if not settings.MAIL_USERNAME or not settings.MAIL_PASSWORD:
            logger.warning("Email service not configured - MAIL_USERNAME or MAIL_PASSWORD missing")
            self._mailer = None
        else:
            config = ConnectionConfig(
                MAIL_USERNAME=settings.MAIL_USERNAME,
                MAIL_PASSWORD=settings.MAIL_PASSWORD,
                MAIL_FROM=settings.MAIL_FROM,
                MAIL_PORT=settings.MAIL_PORT,
                MAIL_SERVER=settings.MAIL_SERVER,
                MAIL_STARTTLS=True,
                MAIL_SSL_TLS=False,
                TEMPLATE_FOLDER=Path(__file__).parent.parent / 'templates'
            )
            self._mailer = FastMail(config)
    
    async def send_templated_email(
        self, 
        subject: str, 
        recipient: EmailStr, 
        template_name: str, 
        context: dict
    ) -> bool:
        """
        Send a templated email.
        
        Args:
            subject: Email subject
            recipient: Recipient email address
            template_name: Template file name
            context: Template context variables
            
        Returns:
            bool: True if email sent successfully
            
        Raises:
            Exception: If email sending fails
        """
        if not self._mailer:
            logger.error("Cannot send email - mailer not configured")
            return False
        
        try:
            message = MessageSchema(
                subject=subject,
                recipients=[recipient],
                template_body=context,
                subtype=MessageType.html
            )
            await self._mailer.send_message(message, template_name=template_name)
            logger.info(f"Email sent to {recipient}: {subject}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to send email to {recipient}: {e}")
            raise


# ============================================================================
# DEPENDENCY INJECTION
# ============================================================================

_email_service: Optional[EmailService] = None


def get_email_service() -> EmailService:
    """
    Get singleton EmailService instance.
    
    Returns:
        EmailService: Singleton service instance
    """
    global _email_service
    if _email_service is None:
        _email_service = EmailService()
    return _email_service


# ============================================================================
# BACKWARD COMPATIBILITY
# ============================================================================

async def send_templated_email(
    subject: str, 
    recipient: EmailStr, 
    template_name: str, 
    context: dict
):
    """Backward compatibility wrapper."""
    return await get_email_service().send_templated_email(
        subject, recipient, template_name, context
    )