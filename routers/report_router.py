from fastapi import APIRouter, Depends, HTTPException, Query, Form
from typing import List, Optional
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
import uuid
from datetime import datetime
from backend.database import get_session
from backend.models import Report, Status, Vote, VoteType
from backend.schemas import ReportCreate, ReportUpdate, ReportRead, VoteCreate, VoteRead
from backend.utils import (
    generate_presigned_s3_url,
    create_jwt_token,
    create_task_id,
    push_task_to_queue,
    get_queue_position,
    update_task_status
)
router = APIRouter(prefix="/reports", tags=["Reports"])

#Create report
@router.post("/create", response_model=ReportRead)
async def create_report(
    data: ReportCreate,
    session: AsyncSession = Depends(get_session)
):
    task_id=create_task_id()
    object_path = f"proofs/{uuid.uuid4()}.dat"
    presigned_url = generate_presigned_s3_url(object_path)
    task_jwt = create_jwt_token({"task_id": str(uuid.uuid4())})
    report = Report(
        title=data.title,
        description=data.description,
        category=data.category,
        detail=data.detail,
        status=data.status,
        evidence_url=object_path,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )

    session.add(report)
    await session.commit()
    await session.refresh(report)
    #push task into Redis queue
    push_task_to_queue(task_id=task_id, object_path=object_path, user_id=report.id)

    report_dict = ReportRead.from_orm(report).dict()
    report_dict.update({
        "task_id": report.id,
        "presigned_url": presigned_url,
        "object_path": object_path,
        "jwt_token": task_jwt,
        "queue_position": get_queue_position(task_id)
    })
    return report_dict


# Update report 

@router.patch("/{report_id}", response_model=ReportRead)
async def update_report(
    report_id: str,
    data: ReportUpdate,
    session: AsyncSession = Depends(get_session),
):
    result = await session.execute(select(Report).where(Report.id == report_id))
    report = result.scalar_one_or_none()

    if not report:
        raise HTTPException(status_code=404, detail="Report not found")

    # Update từng field
    update_data = data.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(report, key, value)
        
    report.updated_at = datetime.utcnow()

    await session.commit()
    await session.refresh(report)

    return report


#List reports

@router.get("/", response_model=List[ReportRead])
async def list_reports(
    session: AsyncSession = Depends(get_session),
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0)
):
    result = await session.execute(
        select(Report)
        .where(Report.status == Status.Publish)
        .limit(limit)
        .offset(offset)
    )

    reports = result.scalars().all()

    now = datetime.utcnow()
    changed = False
    for r in reports:
        if (now - r.created_at).days >= 30:
            bl = sum(1 for v in r.votes if v.vote_type == VoteType.Blacklist)
            wl = sum(1 for v in r.votes if v.vote_type == VoteType.Whitelist)
            if bl > wl:
                r.status = Status.Blacklist
                changed = True
                session.add(r)
        r.queue_position=get_queue_position(r.id)
    if changed:
        await session.commit()

    return reports

#Vote

@router.post("/votes/", response_model=VoteRead)
async def vote_report(vote_in: VoteCreate, session: AsyncSession = Depends(get_session)):
    result = await session.execute(select(Report).where(Report.id == vote_in.report_id))
    report = result.scalar_one_or_none()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")

    result = await session.execute(
        select(Vote).where(Vote.user_id == vote_in.user_id, Vote.report_id == vote_in.report_id)
    )
    existing_vote = result.scalar_one_or_none()

    if existing_vote:
        existing_vote.vote_type = vote_in.vote_type
        existing_vote.created_at = datetime.utcnow()
        session.add(existing_vote)
        await session.commit()
        await session.refresh(existing_vote)
        return existing_vote

    vote = Vote(
        user_id=vote_in.user_id,
        report_id=vote_in.report_id,
        vote_type=vote_in.vote_type
    )
    session.add(vote)
    await session.commit()
    await session.refresh(vote)
    return vote
