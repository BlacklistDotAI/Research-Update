from sqlalchemy import Column, Integer, String, DateTime, Enum,Text,ForeignKey,Float,Boolean
from pydantic import EmailStr
import enum
from datetime import datetime, timezone
import uuid
from app.core.postgres_client import Base
from sqlalchemy.sql import func
#Donate Form
class ContributionInterest(enum.Enum):
    skills_time="Skills and time"
    project_data="Project/Data"
    infra ="Infrastructure"
    fin_commitment= "Financial Commitment"
    
class ContributionSkill(enum.Enum):
    ai_ml = "AI/ML"
    software = "Software (FE/BE)"
    design_ux = "Design/UX"
    product = "Product"
    data_bi = "Data/BI"
    security_legal = "Security/Legal"
    moderation = "Moderation"
    growth_content = "Growth/Content"

class ParticipationTime(enum.Enum):
    ad_hoc = "Ad-hoc / Mini Task"
    part_time = "Part-time"
    full_time = "Temporary full-time (per sprint)"

class Donate(Base):
    __tablename__ = "donates"
    __allow_unmapped__ = True

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(100), nullable=False)
    email = Column(String(100), nullable=False)
    phone_number = Column(String(20), nullable=True)
    organization = Column(String(100), nullable=True)
    
    contribution_interest = Column(
        Enum(ContributionInterest, name="contribution_interest_enum"), 
        nullable=False
    )
    
    contribution_skill = Column(
        Enum(ContributionSkill, name="contribution_skill_enum"),
        nullable=True  
    )
    
    participation_time = Column(
        Enum(ParticipationTime, name="participation_time_enum"),
        nullable=True  
    )
    
    referral_link = Column(String(255), nullable=True)  
    note = Column(Text, nullable=True)  
    
    accept_information = Column(Boolean, default=False,nullable=False)
    accept_no_abuse = Column(Boolean, default=False,nullable=False)
    
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
