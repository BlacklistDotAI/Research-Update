# app/services/auth_service.py
"""
Authentication service for admin and worker authentication.
Handles password hashing, JWT token creation/validation, and token blocklisting.
"""
import hashlib
import uuid
from datetime import datetime, timedelta, timezone
from typing import Optional, Tuple
import bcrypt
from jose import JWTError, jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer

from app.core.config import get_settings
from app.services.redis_service import RedisService
from app.schemas.user import AdminUser

settings = get_settings()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/admin/login")




class AuthService:
    """
    Service class for authentication and authorization operations.
    Handles password hashing, JWT token creation/validation, and token blocklisting.
    """
    
    def __init__(self, redis_service: RedisService):
        """
        Initialize AuthService.
        
        Args:
            redis_service: RedisService instance for token blocklisting
        """
        self.redis = redis_service
    
    # ============================================================================
    # PASSWORD OPERATIONS
    # ============================================================================
    
    def verify_password(self, plain_password: str, hashed_password: str) -> bool:
        """
        Verify a password against a hashed password.
        
        Args:
            plain_password: Plain text password
            hashed_password: Hashed password to verify against
            
        Returns:
            bool: True if password matches, False otherwise
        """
        return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))
    
    def hash_password(self, password: str) -> str:
        """
        Hash a password.
        
        Args:
            password: Plain text password
            
        Returns:
            str: Hashed password
        """
        return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    
    # ============================================================================
    # JWT TOKEN OPERATIONS
    # ============================================================================
    
    def create_access_token(
        self, 
        data: dict, 
        secret_key: str, 
        expires_delta: Optional[timedelta] = None
    ) -> str:
        """
        Create a JWT access token.
        
        Args:
            data: Data to encode in token
            secret_key: Secret key for encoding
            expires_delta: Token expiration time
            
        Returns:
            str: Encoded JWT token
        """
        to_encode = data.copy()
        
        if expires_delta:
            expire = datetime.now(timezone.utc) + expires_delta
            to_encode.update({"exp": expire})
        
        to_encode.update({
            "iat": datetime.now(timezone.utc),
            "jti": str(uuid.uuid4())  # Unique token ID for blocklisting
        })
        
        encoded_jwt = jwt.encode(to_encode, secret_key, algorithm=settings.JWT_ALGORITHM)
        return encoded_jwt
    
    def create_admin_tokens(self, username: str) -> tuple[str, str]:
        """
        Create access and refresh tokens for admin user.
        
        Args:
            username: Admin username
            
        Returns:
            tuple: (access_token, refresh_token)
        """
        access_token_expires = timedelta(minutes=30)
        access_token = self.create_access_token(
            data={"sub": username, "type": "access"},
            secret_key=settings.ADMIN_JWT_SECRET_KEY,
            expires_delta=access_token_expires
        )
        
        refresh_token_expires = timedelta(days=7)
        refresh_token = self.create_access_token(
            data={"sub": username, "type": "refresh"},
            secret_key=settings.ADMIN_JWT_SECRET_KEY,
            expires_delta=refresh_token_expires
        )
        
        return access_token, refresh_token
    
    def create_worker_token(self, worker_id: str) -> str:
        """
        Create token for worker.
        
        Args:
            worker_id: Worker ID
            
        Returns:
            str: JWT token (never expires)
        """
        return self.create_access_token(
            data={"sub": worker_id},
            secret_key=settings.WORKER_JWT_SECRET_KEY,
            expires_delta=None
        )
    
    # ============================================================================
    # TOKEN VALIDATION
    # ============================================================================
    
    def verify_admin_token(self, token: str) -> AdminUser:
        """
        Verify admin JWT token and return user info.
        Checks if token is blocklisted (logged out).
        
        Args:
            token: JWT token to verify
            
        Returns:
            AdminUser: Admin user info
            
        Raises:
            HTTPException: If token is invalid or blocklisted
        """
        credentials_exception = HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
        
        try:
            payload = jwt.decode(
                token,
                settings.ADMIN_JWT_SECRET_KEY,
                algorithms=[settings.JWT_ALGORITHM]
            )
            username: str = payload.get("sub")
            jti: str = payload.get("jti")
            
            if username is None:
                raise credentials_exception
            
            # Check if token is blocklisted (logged out)
            if jti and self.is_token_blocklisted(jti):
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Token has been revoked",
                    headers={"WWW-Authenticate": "Bearer"},
                )
            
            return AdminUser(username=username, role="admin")
            
        except JWTError:
            raise credentials_exception
    
    # ============================================================================
    # TOKEN BLOCKLIST (for logout)
    # ============================================================================
    
    def is_token_blocklisted(self, jti: str) -> bool:
        """
        Check if token is in blocklist.
        
        Args:
            jti: Token unique identifier
            
        Returns:
            bool: True if token is blocklisted
        """
        return self.redis.sismember("auth:admin_blocklist", jti)
    
    def blocklist_token(self, jti: str) -> None:
        """
        Add token to blocklist (logout).
        
        Args:
            jti: Token unique identifier
        """
        self.redis.sadd("auth:admin_blocklist", jti)
    
    # ============================================================================
    # UTILITY
    # ============================================================================
    
    @staticmethod
    def hash_token(token: str) -> str:
        """
        Hash a token using SHA-256.
        
        Args:
            token: Token to hash
            
        Returns:
            str: Hashed token
        """
        return hashlib.sha256(token.encode()).hexdigest()


# ============================================================================
# DEPENDENCY INJECTION
# ============================================================================

_auth_service: Optional[AuthService] = None


def get_auth_service(redis_service: Optional[RedisService] = None) -> AuthService:
    """
    Get singleton AuthService instance.
    
    Args:
        redis_service: Optional RedisService instance
        
    Returns:
        AuthService: Singleton service instance
    """
    global _auth_service
    if _auth_service is None:
        from app.services.redis_service import get_redis_service
        redis_service = redis_service or get_redis_service()
        _auth_service = AuthService(redis_service)
    return _auth_service


async def get_current_admin(token: str = Depends(oauth2_scheme)) -> AdminUser:
    """
    FastAPI dependency for getting current authenticated admin.
    
    Args:
        token: JWT token from request
        
    Returns:
        AdminUser: Current admin user
    """
    auth_service = get_auth_service()
    return auth_service.verify_admin_token(token)


async def get_current_worker(token: str = Depends(oauth2_scheme)):
    """
    FastAPI dependency for getting current authenticated worker.
    
    Args:
        token: JWT token from request
        
    Returns:
        WorkerUser: Current worker user
        
    Raises:
        HTTPException: If token is invalid
    """
    from app.schemas.user import WorkerUser
    from app.core.redis_client import get_redis
    
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate worker credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        payload = jwt.decode(
            token,
            settings.WORKER_JWT_SECRET_KEY,
            algorithms=[settings.JWT_ALGORITHM],
            options={"verify_exp": False}  # Worker tokens don't expire
        )
        worker_id: str = payload.get("sub")
        
        if worker_id is None:
            raise credentials_exception
        
        # Get worker info from Redis
        r = get_redis()
        worker_data = r.hgetall(f"worker:{worker_id}")
        
        if not worker_data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Worker not found"
            )
        
        return WorkerUser(
            worker_id=worker_id,
            name=worker_data.get("name", "Unknown")
        )
        
    except JWTError:
        raise credentials_exception


# Backward compatibility exports
def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Backward compatibility wrapper."""
    return get_auth_service().verify_password(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    """Backward compatibility wrapper."""
    return get_auth_service().hash_password(password)


def create_admin_tokens(username: str) -> tuple[str, str]:
    """Backward compatibility wrapper."""
    return get_auth_service().create_admin_tokens(username)


def create_worker_token(worker_id: str) -> str:
    """Backward compatibility wrapper."""
    return get_auth_service().create_worker_token(worker_id)


def hash_token(token: str) -> str:
    """Backward compatibility wrapper."""
    return AuthService.hash_token(token)