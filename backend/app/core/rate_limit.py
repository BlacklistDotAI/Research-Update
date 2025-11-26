# app/core/rate_limit.py
"""
Rate limiting configuration and key functions.
Provides custom key functions for different rate limiting strategies.
"""
from fastapi import Request
from slowapi.util import get_remote_address
from jose import jwt, JWTError
from .config import get_settings

settings = get_settings()


def get_admin_user_identifier(request: Request) -> str:
    """
    Rate limit admin endpoints by username.
    Falls back to IP if token is invalid.
    
    Use this for authenticated admin endpoints where each user
    should have their own rate limit quota.
    
    Args:
        request: FastAPI request object
        
    Returns:
        str: Rate limit key in format "admin:{username}" or "ip:{address}"
    """
    try:
        auth_header = request.headers.get("Authorization", "")
        if not auth_header.startswith("Bearer "):
            return f"ip:{_get_real_ip(request)}"
        
        token = auth_header.replace("Bearer ", "")
        payload = jwt.decode(
            token, 
            settings.ADMIN_JWT_SECRET_KEY, 
            algorithms=[settings.JWT_ALGORITHM]
        )
        username = payload.get("sub", "anonymous")
        return f"admin:{username}"
    except (JWTError, Exception):
        # Fallback to IP if token invalid or missing
        return f"ip:{_get_real_ip(request)}"


def get_worker_identifier(request: Request) -> str:
    """
    Rate limit worker endpoints by worker_id from JWT.
    Falls back to IP if token is invalid.
    
    Use this for authenticated worker endpoints where each worker
    should have their own rate limit quota.
    
    Args:
        request: FastAPI request object
        
    Returns:
        str: Rate limit key in format "worker:{worker_id}" or "ip:{address}"
    """
    try:
        auth_header = request.headers.get("Authorization", "")
        if not auth_header.startswith("Bearer "):
            return f"ip:{_get_real_ip(request)}"
        
        token = auth_header.replace("Bearer ", "")
        payload = jwt.decode(
            token, 
            settings.WORKER_JWT_SECRET_KEY, 
            algorithms=[settings.JWT_ALGORITHM]
        )
        worker_id = payload.get("sub", "anonymous")
        return f"worker:{worker_id}"
    except (JWTError, Exception):
        # Fallback to IP if token invalid or missing
        return f"ip:{_get_real_ip(request)}"


def get_client_identifier(request: Request) -> str:
    """
    Rate limit public client endpoints by real client IP.
    
    When behind proxy (TRUST_PROXY_HEADERS=True), extracts real IP from X-Forwarded-For.
    Otherwise falls back to remote address.
    
    Use this for public endpoints to prevent abuse from single source.
    
    Args:
        request: FastAPI request object
        
    Returns:
        str: Rate limit key in format "ip:{address}"
    """
    return f"ip:{_get_real_ip(request)}"


def _get_real_ip(request: Request) -> str:
    """
    Get real client IP address, handling proxy setup.
    
    When TRUST_PROXY_HEADERS=True and behind proxy:
    - Extracts first IP from X-Forwarded-For header (real client IP)
    
    Otherwise:
    - Returns remote address (direct connection or proxy IP)
    
    Args:
        request: FastAPI request object
        
    Returns:
        str: Client IP address
    """
    # If we trust proxy headers, try to get real IP from X-Forwarded-For
    if settings.TRUST_PROXY_HEADERS:
        forwarded_for = request.headers.get("X-Forwarded-For", "")
        if forwarded_for:
            # X-Forwarded-For: client, proxy1, proxy2
            # First IP is the real client
            real_ip = forwarded_for.split(",")[0].strip()
            if real_ip:
                return real_ip
    
    # Fallback to remote address (direct connection or proxy IP)
    return get_remote_address(request)
