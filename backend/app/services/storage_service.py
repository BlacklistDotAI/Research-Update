# app/core/storage_service.py
"""
StorageService - Centralized S3-compatible storage operations.
Provides a clean interface for object storage operations (R2, S3, MinIO, etc.).
"""
import boto3
import uuid
import logging
from typing import Optional
from botocore.exceptions import ClientError
from fastapi import HTTPException
from app.core.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()


class StorageService:
    """
    Service class for S3-compatible storage operations.
    Supports AWS S3, Cloudflare R2, MinIO, and other compatible services.
    """
    
    def __init__(self):
        """Initialize StorageService with S3 client."""
        self._client = None
    
    @property
    def client(self):
        """Lazy-load S3 client."""
        if self._client is None:
            self._client = boto3.client(
                "s3",
                endpoint_url=settings.S3_ENDPOINT_URL,
                aws_access_key_id=settings.S3_ACCESS_KEY_ID,
                aws_secret_access_key=settings.S3_SECRET_ACCESS_KEY,
                region_name=settings.S3_REGION,
            )
        return self._client
    
    # ============================================================================
    # PRESIGNED URL OPERATIONS
    # ============================================================================
    
    def generate_presigned_upload_url(
        self, 
        filename: str, 
        content_type: str, 
        content_length: int
    ) -> dict:
        """
        Generate presigned URL for file upload.
        
        Args:
            filename: Original filename
            content_type: MIME type
            content_length: File size in bytes
            
        Returns:
            dict: Contains 'url', 'key', and 'method'
            
        Raises:
            HTTPException: If file is too large or URL generation fails
        """
        # Validate file size
        max_bytes = settings.S3_MAX_UPLOAD_MB * 1024 * 1024
        if content_length > max_bytes:
            raise HTTPException(
                status_code=400, 
                detail=f"File too large. Maximum size: {settings.S3_MAX_UPLOAD_MB}MB"
            )
        
        # Generate unique object key
        object_key = f"uploads/{uuid.uuid4()}-{filename}"
        
        try:
            url = self.client.generate_presigned_url(
                "put_object",
                ExpiresIn=settings.S3_PRESIGNED_EXPIRE,
                Params={
                    "Bucket": settings.S3_BUCKET_NAME,
                    "Key": object_key,
                    "ContentType": content_type,
                    "ContentLength": content_length,
                },
            )
            return {
                "url": url, 
                "key": object_key, 
                "method": "PUT"
            }
        except ClientError as e:
            logger.error(f"S3 presigned upload URL error: {e}")
            raise HTTPException(
                status_code=500, 
                detail="Failed to generate upload URL"
            )
    
    def generate_presigned_download_url(
        self, 
        object_key: str, 
        expires_in: Optional[int] = None
    ) -> str:
        """
        Generate presigned URL for file download.
        
        Args:
            object_key: S3 object key
            expires_in: URL expiration time in seconds
            
        Returns:
            str: Presigned download URL
            
        Raises:
            HTTPException: If URL generation fails
        """
        expires = expires_in or settings.S3_PRESIGNED_EXPIRE
        
        try:
            url = self.client.generate_presigned_url(
                "get_object",
                ExpiresIn=expires,
                Params={
                    "Bucket": settings.S3_BUCKET_NAME,
                    "Key": object_key,
                },
            )
            return url
        except ClientError as e:
            logger.error(f"S3 presigned download URL error: {e}")
            raise HTTPException(
                status_code=500, 
                detail="Failed to generate download URL"
            )
    
    # ============================================================================
    # OBJECT OPERATIONS
    # ============================================================================
    
    def delete_object(self, object_key: str) -> bool:
        """
        Delete an object from S3.
        
        Args:
            object_key: S3 object key
            
        Returns:
            bool: True if successful
        """
        try:
            self.client.delete_object(
                Bucket=settings.S3_BUCKET_NAME,
                Key=object_key
            )
            return True
        except ClientError as e:
            logger.error(f"S3 delete object error: {e}")
            return False
    
    def list_objects(self, prefix: str = "", max_keys: int = 1000) -> list:
        """
        List objects in S3 bucket.
        
        Args:
            prefix: Filter objects by prefix
            max_keys: Maximum number of keys to return
            
        Returns:
            list: List of object keys
        """
        try:
            response = self.client.list_objects_v2(
                Bucket=settings.S3_BUCKET_NAME,
                Prefix=prefix,
                MaxKeys=max_keys
            )
            return [obj['Key'] for obj in response.get('Contents', [])]
        except ClientError as e:
            logger.error(f"S3 list objects error: {e}")
            return []
    
    def object_exists(self, object_key: str) -> bool:
        """
        Check if an object exists in S3.
        
        Args:
            object_key: S3 object key
            
        Returns:
            bool: True if object exists
        """
        try:
            self.client.head_object(
                Bucket=settings.S3_BUCKET_NAME,
                Key=object_key
            )
            return True
        except ClientError:
            return False


# Singleton instance
_storage_service: Optional[StorageService] = None


def get_storage_service() -> StorageService:
    """
    Get singleton StorageService instance.
    
    Returns:
        StorageService: Singleton service instance
    """
    global _storage_service
    if _storage_service is None:
        _storage_service = StorageService()
    return _storage_service


# ============================================================================
# BACKWARD COMPATIBILITY
# ============================================================================

def generate_presigned_upload_url(filename: str, content_type: str, content_length: int) -> dict:
    """Backward compatibility wrapper."""
    return get_storage_service().generate_presigned_upload_url(filename, content_type, content_length)
