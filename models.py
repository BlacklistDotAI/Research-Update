from sqlmodel import SQLModel, Field, Relationship
from typing import Optional, List
from enum import Enum
from datetime import datetime
import uuid

class Category(str, Enum):
    Phone_Number = "Phone Number"
    Personnel_KOL = "Personnel/KOL"
    Company = "Company"
    Event = "Event"

class Status(str, Enum):
    Draft = "Draft"
    Publish = "Publish"
    Blacklist = "Blacklist"

class VoteType(str, Enum):
    Blacklist = "Blacklist"
    Whitelist = "Whitelist"

class Report(SQLModel, table=True):
    __tablename__ = "reports"
    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    title: str
    description: str
    category: Category
    detail: Optional[str] = None
    evidence_url: Optional[str] = None
    created_by: Optional[str] = None

    status: Status = Status.Draft
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    votes: List["Vote"] = Relationship(back_populates="report")

class Vote(SQLModel, table=True):
    __tablename__ = "votes"
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: str
    report_id: str = Field(foreign_key="reports.id")
    vote_type: VoteType
    created_at: datetime = Field(default_factory=datetime.utcnow)

    report: Optional[Report] = Relationship(back_populates="votes")

# Donate form
class Donate(SQLModel, table=True):
    __tablename__ = "donates"
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str
    email: str
    amount: float
    method: str
    message: Optional[str] = None

    created_at: datetime = Field(default_factory=datetime.utcnow)
