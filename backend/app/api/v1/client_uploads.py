# app/api/v1/client_uploads.py
from fastapi import APIRouter, HTTPException, Request, status
from pydantic import BaseModel, Field
from app.services.storage_service import generate_presigned_upload_url
from app.services.captcha_service import verify_turnstile
from slowapi import Limiter
from slowapi.util import get_remote_address
from app.core.config import get_settings
from app.core.rate_limit import get_client_identifier

settings = get_settings()
limiter = Limiter(key_func=get_client_identifier)  # Per-IP rate limiting

class UploadRequest(BaseModel):
    filename: str = Field(..., description="Name of the file to upload")
    content_type: str = Field(..., description="MIME type of the file")
    content_length: int = Field(..., gt=0, description="Size of the file in bytes")
    turnstile_token: str = Field(..., description="Cloudflare Turnstile verification token")

router = APIRouter(prefix="/client", tags=["uploads"])

@router.post("/uploads/presigned-url")
@limiter.limit(settings.API_RATE_LIMIT, key_func=get_client_identifier)
async def get_upload_url(request: Request, req: UploadRequest):
    """
    Generate presigned upload URL

    Returns a presigned URL for direct upload to S3-compatible storage.
    Requires Cloudflare Turnstile verification to prevent abuse.

    The returned URL can be used to upload the file directly to storage
    using a PUT request.
    """
    try:
        await verify_turnstile(req.turnstile_token)
        result = generate_presigned_upload_url(
            req.filename,
            req.content_type,
            req.content_length
        )
        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate upload URL: {str(e)}"
        )