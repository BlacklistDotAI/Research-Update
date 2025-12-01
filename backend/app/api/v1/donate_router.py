from fastapi import APIRouter, Depends, HTTPException, Form
from sqlalchemy.orm import Session
from sqlalchemy import select
from typing import List,Optional
from datetime import datetime
from pydantic import BaseModel,EmailStr, ValidationError
from app.core.postgres_client import get_db
from app.models.donate import Donate
from app.schemas.donate import DonateCreate, DonateRead,ContributionInterest,ContributionSkill,ParticipationTime
import random, string


router = APIRouter(prefix="/donates", tags=["Donate"])


# ----- Create donation -----
class EmailValidator(BaseModel):
    email: EmailStr
    
@router.post("/", response_model=DonateRead)
def create_donate(
    name: str = Form(...),
    email: str = Form(...),
    phone_number: str = Form(None),
    organization: str = Form(None),

    contribution_interest: ContributionInterest = Form(...),
    contribution_skill: Optional[ContributionSkill] = Form(None),
    participation_time: Optional[ParticipationTime] = Form(None),

    referral_link: str = Form(None),
    note: str = Form(None),

    accept_information: bool = Form(...),
    accept_no_abuse: bool = Form(...),

    db: Session = Depends(get_db)
):
    try:
        validated = EmailValidator(email=email)
        valid_email = validated.email
    except ValidationError:
        raise HTTPException(status_code=400, detail="Invalid Email")
    
    donate = Donate(
        name=name,
        email=str(valid_email),
        phone_number=phone_number,
        organization=organization,

        contribution_interest=contribution_interest,
        contribution_skill=contribution_skill,
        participation_time=participation_time,

        referral_link=referral_link,
        note=note,

        accept_information=accept_information,
        accept_no_abuse=accept_no_abuse,

        created_at=datetime.utcnow()
    )

    db.add(donate)
    db.commit()
    db.refresh(donate)
    return donate

#GET donates
@router.get("/list",response_model=List[DonateRead])
def get_reports(db: Session=Depends(get_db)):
    reports=db.query(Donate).all()
    return reports
