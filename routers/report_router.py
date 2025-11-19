from fastapi import APIRouter, Depends, HTTPException, Form, File, UploadFile, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from datetime import datetime
from typing import List
import uuid, os

from backend.database import get_session
from backend.models import Report, Vote, ProofType, Status, VoteType, Category
from backend.schemas import ReportRead, VoteCreate, VoteRead

router = APIRouter(prefix="/reports", tags=["Report"])
UPLOAD_DIR = "uploads"
# Ensure the upload directory exists
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.post("/", response_model=ReportRead)
async def create_report(
    # Use Form fields with direct Enum type hints for automatic validation
    title: str = Form(...),
    description: str = Form(...),
    category: Category = Form(...), # Direct Enum usage
    detail: str = Form(None),
    status: Status = Form(Status.Draft), # Direct Enum usage
    proof_file: UploadFile = File(None),
    session: AsyncSession = Depends(get_session)
):
    """Creates a new report and uploads the proof file (if provided)."""
    
    file_path, proof_type = None, None
    if proof_file and proof_file.filename:
        ext = proof_file.filename.split(".")[-1]
        file_name = f"{uuid.uuid4()}.{ext}"
        file_path = f"{UPLOAD_DIR}/{file_name}"
        # Save the file
        with open(file_path, "wb") as f:
            f.write(await proof_file.read())
        
        # Determine proof type
        content_type = proof_file.content_type.split('/')[0]
        if content_type == "image":
            proof_type = ProofType.image
        elif content_type == "video":
            proof_type = ProofType.video
        elif content_type == "audio":
            proof_type = ProofType.audio
        else:
            proof_type = None

    report = Report(
        title=title, description=description, category=category,
        detail=detail, status=status, proof_file=file_path, proof_type=proof_type
    )
    session.add(report)
    await session.commit()
    await session.refresh(report)
    return report

class ReportWithVotes(ReportRead):
    whitelist_votes: int = 0
    blacklist_votes: int = 0

@router.get("/publish/", response_model=List[ReportWithVotes])
async def list_publish_reports(
    session: AsyncSession = Depends(get_session),
    limit: int = Query(20),
    offset: int = Query(0)
):
    stmt = select(Report).options(selectinload(Report.votes))\
                          .where(Report.status == Status.Publish)\
                          .limit(limit).offset(offset)
    result = await session.execute(stmt)
    reports = result.scalars().all()

    now = datetime.utcnow()
    reports_to_update = []

    reports_with_votes = []
    for r in reports:
        # Count votes
        bl = sum(1 for v in r.votes if v.vote_type == VoteType.Blacklist)
        wl = sum(1 for v in r.votes if v.vote_type == VoteType.Whitelist)

        # Auto-classify reports older than 30 days
        if (now - r.created_at).days >= 30 and bl > wl:
            r.status = Status.Blacklist
            reports_to_update.append(r)
        else:
            reports_with_votes.append(
                ReportWithVotes(
                    id=r.id,
                    title=r.title,
                    description=r.description,
                    category=r.category,
                    detail=r.detail,
                    status=r.status,
                    proof_file=r.proof_file,
                    proof_type=r.proof_type,
                    created_at=r.created_at,
                    updated_at=r.updated_at,
                    whitelist_votes=wl,
                    blacklist_votes=bl
                )
            )

    if reports_to_update:
        for r in reports_to_update:
            session.add(r)
        await session.commit()

    return reports_with_votes

@router.get("/{report_id}", response_model=ReportRead)
async def get_report(report_id: str, session: AsyncSession = Depends(get_session)):
    """Retrieves the details of a single report."""
    result = await session.execute(
        select(Report).options(selectinload(Report.votes)).where(Report.id == report_id)
    )
    report = result.scalar_one_or_none()
    if not report:
        raise HTTPException(404, "Report not found")
    return report

@router.post("/votes/", response_model=VoteRead)
async def vote_report(vote_in: VoteCreate, session: AsyncSession = Depends(get_session)):
    
    report = await session.get(Report, vote_in.report_id)
    if not report:
        raise HTTPException(404, "Report not found")

    if report.status != Status.Publish:
        raise HTTPException(403, f"Report must be in '{Status.Publish.value}' status to be voted on.")

    result = await session.execute(
        select(Vote).where(Vote.user_id==vote_in.user_id, Vote.report_id==vote_in.report_id)
    )
    existing_vote = result.scalar_one_or_none()
    
    if existing_vote:
        existing_vote.vote_type = vote_in.vote_type
        existing_vote.created_at = datetime.utcnow() # Update the vote time
        await session.commit()
        await session.refresh(existing_vote)
        return existing_vote

    # If no vote exists, create a new one
    vote = Vote(user_id=vote_in.user_id, report_id=vote_in.report_id, vote_type=vote_in.vote_type)
    session.add(vote)
    await session.commit()
    await session.refresh(vote)
    return vote