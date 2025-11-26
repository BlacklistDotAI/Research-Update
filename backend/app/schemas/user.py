from pydantic import BaseModel, EmailStr, ConfigDict
from typing import Optional

class AdminUser(BaseModel):
    username: str
    role: str

class AdminUserInDB(AdminUser):
    hashed_password: str

class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"

class AdminCreate(BaseModel):
    username: str
    email: str
    password: str
    full_name: Optional[str] = None

class AdminUpdate(BaseModel):
    email: Optional[str] = None
    password: Optional[str] = None
    current_password: Optional[str] = None
    full_name: Optional[str] = None
    is_active: Optional[bool] = None

class AdminResponse(BaseModel):
    id: int
    username: str
    email: str
    full_name: Optional[str] = None
    is_active: bool
    is_superuser: bool
    
    model_config = ConfigDict(from_attributes=True)

class WorkerUser(BaseModel):
    """Worker user from JWT token."""
    worker_id: str
    name: str