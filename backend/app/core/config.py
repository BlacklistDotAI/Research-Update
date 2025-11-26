# app/core/config.py
from pydantic_settings import BaseSettings
from pydantic import model_validator
from functools import lru_cache
from typing import Optional

class Settings(BaseSettings):
    # Environment
    ENVIRONMENT: str = "development"  # development, staging, production
    DEBUG: bool = False

    # Redis
    REDIS_URL: str
    REDIS_RETRY_MAX_ATTEMPTS: int = 5
    REDIS_RETRY_BASE_DELAY: float = 1.0  # seconds
    REDIS_RETRY_MAX_DELAY: float = 60.0  # seconds
    REDIS_SOCKET_KEEPALIVE: bool = True
    REDIS_SOCKET_TIMEOUT: int = 5  # seconds
    REDIS_MAX_CONNECTIONS: int = 50  # connection pool size

    # Postgres
    POSTGRES_HOST: str = "postgres"
    POSTGRES_PORT: int = 5432
    POSTGRES_USER: str = "postgres"
    POSTGRES_PASSWORD: str
    POSTGRES_DB: str = "blacklist"
    POSTGRES_URL: Optional[str] = None

    @model_validator(mode='after')
    def assemble_db_connection(self) -> 'Settings':
        if not self.POSTGRES_URL:
            self.POSTGRES_URL = f"postgresql://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}@{self.POSTGRES_HOST}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"
        return self

    # JWT
    ADMIN_JWT_SECRET_KEY: str
    WORKER_JWT_SECRET_KEY: str
    JWT_ALGORITHM: str = "HS256"

    # Task config
    AVG_WAIT_TIME_SECONDS: int = 5
    MAX_RETRIES: int = 0
    MAX_TASK_RETRIES: int = 1  # Maximum number of times a task can be retried by janitor
    TASK_TIMEOUT_SECONDS: int = 30

    # Email (Resend or SMTP – tùy chọn)
    RESEND_API_KEY: Optional[str] = None
    MAIL_USERNAME: Optional[str] = None
    MAIL_PASSWORD: Optional[str] = None
    MAIL_FROM: str = "no-reply@blacklist.example.com"
    MAIL_SERVER: str = "smtp.gmail.com"
    MAIL_PORT: int = 587

    # S3-Compatible Storage (R2, AWS S3, MinIO, etc.)
    S3_ENDPOINT_URL: Optional[str] = None  # R2, MinIO, etc. Nếu None → dùng AWS S3 default
    S3_ACCESS_KEY_ID: str
    S3_SECRET_ACCESS_KEY: str
    S3_BUCKET_NAME: str
    S3_REGION: str = "auto"  # R2 dùng "auto"
    S3_PRESIGNED_EXPIRE: int = 300
    S3_MAX_UPLOAD_MB: int = 25

    # Captcha
    CLOUDFLARE_TURNSTILE_SITE_KEY: str
    CLOUDFLARE_TURNSTILE_SECRET_KEY: str

    # CORS Configuration
    CORS_ORIGINS: str = "*"  # Comma-separated list: "https://app.example.com,https://admin.example.com"
    CORS_ALLOW_CREDENTIALS: bool = True
    CORS_ALLOW_METHODS: str = "GET,POST,PUT,DELETE,PATCH,OPTIONS"
    CORS_ALLOW_HEADERS: str = "*"
    CORS_MAX_AGE: int = 600  # Cache preflight requests for 10 minutes

    # Security
    API_RATE_LIMIT: str = "100/minute"  # Rate limit for API endpoints
    ADMIN_RATE_LIMIT: str = "30/minute"  # Rate limit for admin endpoints
    ALLOWED_HOSTS: str = "*"  # Comma-separated list of allowed hosts
    TRUST_PROXY_HEADERS: bool = False  # Trust X-Forwarded-* headers

    # API Keys (for additional auth layers)
    WORKER_API_KEY: Optional[str] = None  # Optional API key for workers
    ADMIN_API_KEY: Optional[str] = None   # Optional API key for admin endpoints

    class Config:
        env_file = ".env"

    @property
    def cors_origins_list(self) -> list[str]:
        """Parse CORS origins from comma-separated string"""
        if self.CORS_ORIGINS == "*":
            return ["*"]
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",") if origin.strip()]

    @property
    def cors_methods_list(self) -> list[str]:
        """Parse CORS methods from comma-separated string"""
        return [method.strip() for method in self.CORS_ALLOW_METHODS.split(",") if method.strip()]

    @property
    def allowed_hosts_list(self) -> list[str]:
        """Parse allowed hosts from comma-separated string"""
        if self.ALLOWED_HOSTS == "*":
            return ["*"]
        return [host.strip() for host in self.ALLOWED_HOSTS.split(",") if host.strip()]

@lru_cache
def get_settings() -> Settings:
    return Settings()