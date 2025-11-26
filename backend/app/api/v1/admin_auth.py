from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from jose import jwt
import time
from app.services.auth_service import create_admin_tokens, verify_password, get_current_admin, oauth2_scheme
from app.core.postgres_client import get_db
from app.models.admin import Admin
from app.schemas.user import Token, AdminUser
from app.core.config import get_settings
from slowapi import Limiter
from app.core.rate_limit import get_admin_user_identifier

settings = get_settings()
limiter = Limiter(key_func=get_admin_user_identifier)  # Per-user rate limiting

router = APIRouter(prefix="/admin", tags=["admin"])

@router.post("/login", response_model=Token)
@limiter.limit(settings.ADMIN_RATE_LIMIT, key_func=get_admin_user_identifier)
async def admin_login(
    request: Request,
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    """
    Admin login endpoint.
    
    Authenticates admin user from PostgreSQL database.
    Returns JWT access and refresh tokens on successful login.
    """
    # Query admin from Postgres
    admin = db.query(Admin).filter(Admin.username == form_data.username).first()
    
    if not admin:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Verify password
    if not verify_password(form_data.password, admin.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Check if admin is active
    if not admin.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin account is deactivated",
        )
    
    # Create tokens
    access_token, refresh_token = create_admin_tokens(admin.username)
    return Token(access_token=access_token, refresh_token=refresh_token)

@router.post("/logout")
@limiter.limit(settings.ADMIN_RATE_LIMIT, key_func=get_admin_user_identifier)
async def admin_logout(
    request: Request,
    current_admin: AdminUser = Depends(get_current_admin),
):
    """
    Admin logout endpoint.
    
    Blocklists the current access token to invalidate the session.
    """
    from app.services.auth_service import get_auth_service
    
    try:
        # Extract token from Authorization header
        token = request.headers.get("Authorization", "").replace("Bearer ", "")
        
        # Blocklist token via AuthService
        auth_service = get_auth_service()
        auth_service.blocklist_token(token)
        
        return {"message": "Logged out successfully"}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid token"
        )
