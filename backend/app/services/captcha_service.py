# app/services/captcha_service.py
"""
CaptchaService - Handles Cloudflare Turnstile verification.
Refactored to class-based service with dependency injection.
"""
import httpx
import logging
from typing import Optional
from fastapi import HTTPException

from app.core.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()


class CaptchaService:
    """
    Service class for CAPTCHA verification operations.
    Uses Cloudflare Turnstile for bot protection.
    """
    
    def __init__(self):
        """Initialize CaptchaService."""
        self.secret_key = settings.CLOUDFLARE_TURNSTILE_SECRET_KEY
        self.verify_url = "https://challenges.cloudflare.com/turnstile/v0/siteverify"
        self._http_client: Optional[httpx.AsyncClient] = None
    
    @property
    def http_client(self) -> httpx.AsyncClient:
        """Lazy-load HTTP client."""
        if self._http_client is None:
            self._http_client = httpx.AsyncClient()
        return self._http_client
    
    async def verify_turnstile(self, token: str) -> bool:
        """
        Verify Cloudflare Turnstile token.
        
        Args:
            token: Turnstile token from frontend
            
        Returns:
            bool: True if verification successful
            
        Raises:
            HTTPException: If token is missing or verification fails
        """
        if not token:
            raise HTTPException(
                status_code=400, 
                detail="Turnstile token required"
            )
        
        try:
            response = await self.http_client.post(
                self.verify_url,
                json={
                    "secret": self.secret_key, 
                    "response": token
                }
            )
            result = response.json()
            
            if not result.get("success"):
                logger.warning(f"Turnstile verification failed: {result}")
                raise HTTPException(
                    status_code=403, 
                    detail="Turnstile verification failed – possible bot"
                )
            
            return True
            
        except httpx.HTTPError as e:
            logger.error(f"Turnstile HTTP error: {e}")
            raise HTTPException(
                status_code=500, 
                detail="CAPTCHA verification service unavailable"
            )
    
    async def close(self):
        """Close HTTP client."""
        if self._http_client:
            await self._http_client.aclose()
            self._http_client = None


# ============================================================================
# DEPENDENCY INJECTION
# ============================================================================

_captcha_service: Optional[CaptchaService] = None


def get_captcha_service() -> CaptchaService:
    """
    Get singleton CaptchaService instance.
    
    Returns:
        CaptchaService: Singleton service instance
    """
    global _captcha_service
    if _captcha_service is None:
        _captcha_service = CaptchaService()
    return _captcha_service


# ============================================================================
# BACKWARD COMPATIBILITY
# ============================================================================

async def verify_turnstile(token: str) -> bool:
    """Backward compatibility wrapper."""
    return await get_captcha_service().verify_turnstile(token)