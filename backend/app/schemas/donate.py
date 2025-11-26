from pydantic import BaseModel, EmailStr, UUID4,Field
from enum import Enum
from typing import Optional
from datetime import datetime, timezone
from app.models.donate import (
    ContributionInterest, ContributionSkill, ParticipationTime
)
#Donation Form
class DonateCreate(BaseModel):
    name: str = Field(...,description="Name")
    email: EmailStr = Field(...,description="Email")
    phone_number: str = Field(None, max_length=20, description="Phone number to donate")
    organization: Optional[str] = Field(None,description="Organization")

    contribution_interest: ContributionInterest = Field(...,description="Contribution Interest")
    contribution_skill: Optional[ContributionSkill] = Field(None,description="Contribution Skill")
    participation_time: Optional[ParticipationTime] = Field(None,description="Participation Time")

    referral_link: Optional[str] = Field(None,description="Referral Link")
    note: Optional[str] = Field(None,description="Note")

    accept_information: bool
    accept_no_abuse: bool
     

class DonateRead(BaseModel):
    id: int

    name: str
    email: EmailStr
    phone_number: str
    organization: Optional[str] = None

    contribution_interest: ContributionInterest
    contribution_skill: Optional[ContributionSkill] = None
    participation_time: Optional[ParticipationTime] = None

    referral_link: Optional[str] = None
    note: Optional[str] = None

    accept_information: bool
    accept_no_abuse: bool

    created_at: datetime

    class Config:
        from_attributes=True

class DonateResponse(DonateRead):
    pass