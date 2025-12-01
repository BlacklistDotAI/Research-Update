from fastapi import APIRouter, Depends, HTTPException, Form, File, UploadFile, Query
from sqlalchemy.orm import Session, selectinload
from sqlalchemy import select
from datetime import datetime, timezone
from typing import List,Optional
import uuid, os
from app.core.postgres_client import get_db
from app.models.report import Report, ProofType, Status, Category
from app.schemas.report import ReportRead

router = APIRouter(prefix="/reports", tags=["Report"])
UPLOAD_DIR = "uploads"

# Ensure the upload directory exists
MAX_FILE_SIZE = 20 * 1024 * 1024
os.makedirs(UPLOAD_DIR, exist_ok=True)

ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/jpg", "image/webp"}
ALLOWED_VIDEO_TYPES = {"video/mp4", "video/mpeg", "video/quicktime"}
ALLOWED_AUDIO_TYPES = {"audio/mpeg", "audio/wav", "audio/x-wav", "audio/mp3"}
ALLOWED_EXTS = {"jpg", "jpeg", "png", "webp", "mp4", "mov", "mp3", "wav"}


def validate_uploaded_file(upload: UploadFile):
    if not upload or not upload.filename:
        return
    ext = upload.filename.split(".")[-1].lower()
    mime = upload.content_type.lower()
    if ext not in ALLOWED_EXTS:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid file extension '.{ext}'. Allowed: {', '.join(ALLOWED_EXTS)}"
        )
    if (
        mime not in ALLOWED_IMAGE_TYPES
        and mime not in ALLOWED_VIDEO_TYPES
        and mime not in ALLOWED_AUDIO_TYPES
    ):
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type: {mime}"
        )
    file_bytes = upload.file.read()
    if len(file_bytes) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=400,
            detail=f"File too large: {len(file_bytes)/1024/1024:.2f} MB. Max allowed: {MAX_FILE_SIZE/1024/1024} MB."
        )
    upload.file.seek(0)


# ----- Create report -----
@router.post("/", response_model=ReportRead)
def create_report(
    title: str = Form(...),
    description: str = Form(...),
    category: Category = Form(...),
    detail: str = Form(None),
    status: Status = Form(...),
    proof_file: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db)
):
    file_path: Optional[str] = None
    proof_type: Optional[ProofType] = None

    if proof_file is not None and proof_file.filename:
        validate_uploaded_file(proof_file)
        ext = proof_file.filename.split(".")[-1].lower()
        file_name = f"{uuid.uuid4()}.{ext}"
        file_path = os.path.join(UPLOAD_DIR, file_name)
        with open(file_path, "wb") as f:
            f.write(proof_file.file.read())
        proof_file.file.seek(0)

        content_type = proof_file.content_type.split('/')[0]
        if content_type == "image":
            proof_type = ProofType.image
        elif content_type == "video":
            proof_type = ProofType.video
        elif content_type == "audio":
            proof_type = ProofType.audio

    report = Report(
        title=title,
        description=description,
        category=category,
        detail=detail,
        status=status,
        proof_file=file_path,
        proof_type=proof_type
    )

    db.add(report)
    db.commit()
    db.refresh(report)
    return report

#GET reports
@router.get("/published",response_model=List[ReportRead])
def get_reports(db: Session=Depends(get_db)):
    reports=db.query(Report).filter(Report.status=="Publish").all()
    return reports
