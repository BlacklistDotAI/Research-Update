# server.py
import uvicorn
import logging
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse, RedirectResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.staticfiles import StaticFiles
from uvicorn.middleware.proxy_headers import ProxyHeadersMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from jose import jwt, JWTError
from starlette import status
import time # Added for request logging timing
from starlette import status # Added for global exception handler

from app.api.v1 import admin_auth, admin_tasks, client_tasks, client_uploads, admin_workers, admin_phones, client_phone, admin_users
from app.core.config import get_settings
from app.core.redis_client import get_redis
from app.core.postgres_client import get_db

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

settings = get_settings()

# ============================================================================
# RATE LIMITING - Redis-backed with custom key functions
# ============================================================================

# Import key functions from rate_limit module to avoid circular imports
from app.core.rate_limit import get_admin_user_identifier, get_client_identifier

# Initialize rate limiter with Redis storage for distributed rate limiting
limiter = Limiter(
    key_func=get_remote_address,  # Default key function
    storage_uri=settings.REDIS_URL  # Redis backend for scalability
)

app = FastAPI(
    title="Blacklist Distributed Task System",
    version="1.0.0",
    description="A distributed task processing system with queue management",
    docs_url="/api/docs" if settings.DEBUG else None,  # Disable docs in production
    redoc_url="/api/redoc" if settings.DEBUG else None,
    openapi_url="/openapi.json" if settings.DEBUG else None
)

# Add rate limiter to app state
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# ============================================================================
# STATIC FILES & ADMIN DASHBOARD
# ============================================================================

# Mount static files for admin dashboard
app.mount("/static", StaticFiles(directory="app/static"), name="static")

# Redirect /admin to admin login
@app.get("/admin")
async def admin_redirect():
    """Redirect /admin to admin dashboard login"""
    return RedirectResponse(url="/static/admin/login.html")

# ============================================================================
# SECURITY MIDDLEWARE
# ============================================================================

# 1. Proxy Headers - Trust X-Forwarded-* headers when behind a proxy
if settings.TRUST_PROXY_HEADERS:
    app.add_middleware(ProxyHeadersMiddleware, trusted_hosts=settings.allowed_hosts_list)

# 2. CORS - Configurable from environment
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=settings.CORS_ALLOW_CREDENTIALS,
    allow_methods=settings.cors_methods_list,
    allow_headers=[settings.CORS_ALLOW_HEADERS] if settings.CORS_ALLOW_HEADERS != "*" else ["*"],
    max_age=settings.CORS_MAX_AGE,
)

# 3. Trusted Host - Prevent host header attacks
if settings.allowed_hosts_list != ["*"]:
    app.add_middleware(
        TrustedHostMiddleware,
        allowed_hosts=settings.allowed_hosts_list
    )

# 4. GZip compression for responses
app.add_middleware(GZipMiddleware, minimum_size=1000)

# 5. Security headers middleware
@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    """Add security headers to all responses"""
    response = await call_next(request)

    # Prevent clickjacking
    response.headers["X-Frame-Options"] = "DENY"

    # Prevent MIME type sniffing
    response.headers["X-Content-Type-Options"] = "nosniff"

    # XSS Protection
    response.headers["X-XSS-Protection"] = "1; mode=block"

    # Referrer Policy
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"

    # Content Security Policy
    if settings.ENVIRONMENT == "production":
        response.headers["Content-Security-Policy"] = (
            "default-src 'self'; "
            "script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; "
            "style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; "
            "img-src 'self' data: https:; "
            "font-src 'self' data:; "
            "connect-src 'self';"
        )

    # HSTS (HTTP Strict Transport Security) - only in production with HTTPS
    if settings.ENVIRONMENT == "production":
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"

    # Remove server header
    if "Server" in response.headers:
        del response.headers["Server"]

    return response

# 6. Request logging and timing
@app.middleware("http")
async def log_requests(request: Request, call_next):
    """Log all requests with timing"""
    start_time = time.time()

    # Log request
    logger.info(f"Request: {request.method} {request.url.path}")

    response = await call_next(request)

    # Calculate duration
    duration = time.time() - start_time

    # Log response
    logger.info(
        f"Response: {request.method} {request.url.path} "
        f"Status: {response.status_code} Duration: {duration:.3f}s"
    )

    # Add timing header
    response.headers["X-Process-Time"] = str(duration)

    return response

# 7. Exception handling
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Global exception handler to prevent information leakage"""
    logger.error(f"Unhandled exception: {exc}", exc_info=True)

    # Don't expose internal errors in production
    if settings.ENVIRONMENT == "production":
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"detail": "Internal server error"}
        )
    else:
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"detail": str(exc)}
        )

# Include all routers
from app.api.v1 import admin_auth, admin_tasks, client_tasks, client_uploads, admin_workers, admin_phones, client_phone, admin_users, worker_tasks

# ... (existing code)

app.include_router(admin_auth.router, prefix="/api/v1")
app.include_router(admin_tasks.router, prefix="/api/v1")
app.include_router(admin_workers.router, prefix="/api/v1")
app.include_router(admin_phones.router, prefix="/api/v1")
app.include_router(admin_users.router, prefix="/api/v1")
app.include_router(worker_tasks.router, prefix="/api/v1")  # Worker API endpoints
app.include_router(client_tasks.router, prefix="/api/v1")
app.include_router(client_uploads.router, prefix="/api/v1")
app.include_router(client_phone.router, prefix="/api/v1")

@app.get("/", tags=["Root"])
async def root():
    """Root endpoint - returns system status"""
    return {"message": "Blacklist system is running", "status": "ok"}

@app.get("/health", tags=["Health"])
async def health_check():
    """Health check endpoint for monitoring - checks Redis and DB connectivity"""
    from app.services.redis_service import get_redis_service
    from app.services.postgres_service import get_postgres_service
    
    health_status = {
        "status": "healthy",
        "service": "Blacklist Distributed Task System",
        "version": "1.0.0",
        "redis": "ok",
        "db": "ok"
    }
    
    # Check Redis connection
    try:
        redis_service = get_redis_service()
        if not redis_service.ping():
            raise Exception("Ping failed")
    except Exception as e:
        health_status["redis"] = f"error: {str(e)}"
        health_status["status"] = "unhealthy"
    
    # Check Database connection
    try:
        postgres_service = get_postgres_service()
        if not postgres_service.health_check():
            raise Exception("Health check failed")
    except Exception as e:
        health_status["db"] = f"error: {str(e)}"
        health_status["status"] = "unhealthy"
    
    # Return appropriate status code
    status_code = 200 if health_status["status"] == "healthy" else 503
    return JSONResponse(content=health_status, status_code=status_code)

if __name__ == "__main__":
    uvicorn.run("server:app", host="0.0.0.0", port=8000, reload=True)