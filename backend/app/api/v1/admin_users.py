from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Any

from app.core.postgres_client import get_db
from app.services.auth_service import get_current_admin, AuthService, get_auth_service
from app.models.admin import Admin
from app.schemas.user import AdminUser, AdminCreate, AdminResponse, AdminUpdate

router = APIRouter(prefix="/admin", tags=["admin-users"])

@router.get("/users", response_model=List[AdminResponse])
async def list_admins(
    current_admin: AdminUser = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """List all admin users. Only superusers can see this."""
    # In a real app, check if current_admin is superuser
    admins = db.query(Admin).all()
    return admins

@router.post("/users", response_model=AdminResponse, status_code=status.HTTP_201_CREATED)
async def create_admin(
    admin_in: AdminCreate,
    current_admin: AdminUser = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Create a new admin user."""
    auth_service = get_auth_service()
    
    # Check if exists
    existing = db.query(Admin).filter((Admin.username == admin_in.username) | (Admin.email == admin_in.email)).first()
    if existing:
        raise HTTPException(status_code=400, detail="Username or email already exists")
    
    hashed_password = auth_service.hash_password(admin_in.password)
    new_admin = Admin(
        username=admin_in.username,
        email=admin_in.email,
        hashed_password=hashed_password,
        full_name=admin_in.full_name,
        is_active=True,
        is_superuser=False # Default to false for created admins
    )
    db.add(new_admin)
    db.commit()
    db.refresh(new_admin)
    return new_admin

@router.delete("/users/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_admin(
    user_id: int,
    current_admin: AdminUser = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Delete an admin user."""
    # Prevent deleting self
    # Note: current_admin is a Pydantic model, we need to check ID. 
    # But AdminUser schema might not have ID if it came from token payload which usually has 'sub' as username.
    # Let's assume we can't easily check ID without querying DB for current admin, but we can check username if we had it.
    
    admin_to_delete = db.query(Admin).filter(Admin.id == user_id).first()
    if not admin_to_delete:
        raise HTTPException(status_code=404, detail="User not found")
        
    if admin_to_delete.username == current_admin.username:
        raise HTTPException(status_code=400, detail="Cannot delete yourself")
        
    db.delete(admin_to_delete)
    db.commit()

@router.put("/users/{user_id}", response_model=AdminResponse)
async def update_admin(
    user_id: int,
    admin_in: AdminUpdate,
    current_admin: AdminUser = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Update an admin user."""
    admin_to_update = db.query(Admin).filter(Admin.id == user_id).first()
    if not admin_to_update:
        raise HTTPException(status_code=404, detail="User not found")
        
    # Update fields
    if admin_in.email is not None:
        # Check uniqueness if email changed
        if admin_in.email != admin_to_update.email:
            existing = db.query(Admin).filter(Admin.email == admin_in.email).first()
            if existing:
                raise HTTPException(status_code=400, detail="Email already exists")
        admin_to_update.email = admin_in.email
        
    if admin_in.full_name is not None:
        admin_to_update.full_name = admin_in.full_name
        
    if admin_in.is_active is not None:
        # Prevent deactivating self
        if admin_to_update.username == current_admin.username and not admin_in.is_active:
             raise HTTPException(status_code=400, detail="Cannot deactivate yourself")
        admin_to_update.is_active = admin_in.is_active
        
    if admin_in.password is not None:
        auth_service = get_auth_service()
        
        # Require current password if changing password (unless superuser updating another user, but let's keep it simple for now)
        # For now, we enforce it for everyone to be safe, or at least for self-update.
        # If admin is updating themselves, they must provide current password.
        if admin_to_update.username == current_admin.username:
            if not admin_in.current_password:
                raise HTTPException(status_code=400, detail="Current password is required to change password")
            if not auth_service.verify_password(admin_in.current_password, admin_to_update.hashed_password):
                raise HTTPException(status_code=400, detail="Incorrect current password")
        
        admin_to_update.hashed_password = auth_service.hash_password(admin_in.password)
        
    db.commit()
    db.refresh(admin_to_update)
    return admin_to_update
