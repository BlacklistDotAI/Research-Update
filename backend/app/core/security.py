# app/core/security.py
"""
Security utilities and middleware
"""

from fastapi import HTTPException, Security, status, Header
from fastapi.security import APIKeyHeader
from typing import Optional
import re
import secrets
from app.core.config import get_settings

settings = get_settings()

# API Key headers
admin_api_key_header = APIKeyHeader(name="X-Admin-API-Key", auto_error=False)
worker_api_key_header = APIKeyHeader(name="X-Worker-API-Key", auto_error=False)


def verify_admin_api_key(api_key: Optional[str] = Security(admin_api_key_header)):
    """
    Verify admin API key if configured

    This provides an additional layer of security beyond JWT tokens.
    """
    if not settings.ADMIN_API_KEY:
        # API key not configured, skip check
        return True

    if not api_key:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin API key required"
        )

    if not secrets.compare_digest(api_key, settings.ADMIN_API_KEY):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Invalid admin API key"
        )

    return True


def verify_worker_api_key(api_key: Optional[str] = Security(worker_api_key_header)):
    """
    Verify worker API key if configured

    This provides an additional layer of security beyond JWT tokens.
    """
    if not settings.WORKER_API_KEY:
        # API key not configured, skip check
        return True

    if not api_key:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Worker API key required"
        )

    if not secrets.compare_digest(api_key, settings.WORKER_API_KEY):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Invalid worker API key"
        )

    return True


def sanitize_input(text: str, max_length: int = 1000) -> str:
    """
    Sanitize user input to prevent injection attacks

    Args:
        text: Input text to sanitize
        max_length: Maximum allowed length

    Returns:
        Sanitized text
    """
    if not text:
        return text

    # Limit length
    text = text[:max_length]

    # Remove null bytes
    text = text.replace('\x00', '')

    # Remove control characters except newlines and tabs
    text = ''.join(char for char in text if ord(char) >= 32 or char in '\n\t')

    return text


def validate_phone_number(phone: str) -> bool:
    """
    Validate phone number format

    Accepts international format: +[country code][number]
    """
    pattern = r'^\+?[1-9]\d{1,14}$'
    return bool(re.match(pattern, phone))


def validate_email(email: str) -> bool:
    """
    Validate email format
    """
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return bool(re.match(pattern, email))


def validate_url(url: str, allowed_schemes: list[str] = None) -> bool:
    """
    Validate URL format and scheme

    Args:
        url: URL to validate
        allowed_schemes: List of allowed schemes (default: ['http', 'https'])
    """
    if allowed_schemes is None:
        allowed_schemes = ['http', 'https']

    # Basic URL pattern
    pattern = r'^https?://[^\s/$.?#].[^\s]*$'
    if not re.match(pattern, url):
        return False

    # Check scheme
    scheme = url.split('://')[0].lower()
    return scheme in allowed_schemes


def check_sql_injection(text: str) -> bool:
    """
    Basic SQL injection pattern detection

    Returns True if potential SQL injection detected
    """
    # Common SQL injection patterns
    sql_patterns = [
        r"(\bOR\b|\bAND\b).*?[=<>]",  # OR/AND with comparison
        r";\s*(DROP|DELETE|UPDATE|INSERT|CREATE|ALTER)",  # Dangerous commands
        r"--",  # SQL comments
        r"/\*.*?\*/",  # SQL block comments
        r"(UNION|SELECT|FROM|WHERE)\s",  # SQL keywords
        r"['\";]",  # Quotes and semicolons (basic)
    ]

    text_upper = text.upper()
    for pattern in sql_patterns:
        if re.search(pattern, text_upper, re.IGNORECASE):
            return True

    return False


def check_xss(text: str) -> bool:
    """
    Basic XSS pattern detection

    Returns True if potential XSS detected
    """
    # Common XSS patterns
    xss_patterns = [
        r"<script[^>]*>.*?</script>",  # Script tags
        r"javascript:",  # JavaScript protocol
        r"on\w+\s*=",  # Event handlers (onclick, onload, etc.)
        r"<iframe",  # Iframes
        r"<object",  # Object tags
        r"<embed",  # Embed tags
    ]

    text_lower = text.lower()
    for pattern in xss_patterns:
        if re.search(pattern, text_lower, re.IGNORECASE):
            return True

    return False


def validate_input_security(text: str, field_name: str = "input") -> str:
    """
    Comprehensive input validation

    Raises HTTPException if dangerous patterns detected
    """
    if check_sql_injection(text):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Potential SQL injection detected in {field_name}"
        )

    if check_xss(text):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Potential XSS detected in {field_name}"
        )

    return sanitize_input(text)


def generate_api_key(prefix: str = "sk") -> str:
    """
    Generate a secure API key

    Args:
        prefix: Prefix for the key (e.g., 'sk' for secret key)

    Returns:
        Generated API key
    """
    random_part = secrets.token_urlsafe(32)
    return f"{prefix}_{random_part}"


class IPWhitelist:
    """IP address whitelist checker"""

    def __init__(self, allowed_ips: list[str]):
        self.allowed_ips = set(allowed_ips)

    def is_allowed(self, ip: str) -> bool:
        """Check if IP is in whitelist"""
        if not self.allowed_ips:
            return True  # Empty whitelist = allow all

        return ip in self.allowed_ips or "*" in self.allowed_ips

    def verify(self, ip: str):
        """Verify IP is allowed, raise exception if not"""
        if not self.is_allowed(ip):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="IP address not allowed"
            )


def get_client_ip(
    x_forwarded_for: Optional[str] = Header(None),
    x_real_ip: Optional[str] = Header(None),
) -> str:
    """
    Get client IP address from headers or connection

    Only use forwarded headers if TRUST_PROXY_HEADERS is True
    """
    if settings.TRUST_PROXY_HEADERS:
        # Trust proxy headers
        if x_forwarded_for:
            # X-Forwarded-For can have multiple IPs, use the first one
            return x_forwarded_for.split(',')[0].strip()
        if x_real_ip:
            return x_real_ip

    # Fallback to direct connection (will be set by FastAPI)
    return "0.0.0.0"  # Will be replaced by actual IP in endpoint


# Password strength validator
def validate_password_strength(password: str) -> tuple[bool, str]:
    """
    Validate password strength

    Returns:
        (is_valid, message)
    """
    if len(password) < 8:
        return False, "Password must be at least 8 characters long"

    if not re.search(r'[A-Z]', password):
        return False, "Password must contain at least one uppercase letter"

    if not re.search(r'[a-z]', password):
        return False, "Password must contain at least one lowercase letter"

    if not re.search(r'[0-9]', password):
        return False, "Password must contain at least one digit"

    if not re.search(r'[!@#$%^&*(),.?":{}|<>]', password):
        return False, "Password must contain at least one special character"

    return True, "Password is strong"
