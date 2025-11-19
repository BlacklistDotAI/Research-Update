from sqlmodel import SQLModel, Field, Relationship
from typing import Optional, List
from enum import Enum
from datetime import datetime
import uuid

# Report categories
class Category(str, Enum):
    Phone_Number = "Phone Number"
    Personnel_KOL = "Personnel/KOL"
    Company = "Company"
    Event = "Event"

# Report status
class Status(str, Enum):
    Draft = "Draft"
    Publish = "Publish"
    Blacklist = "Blacklist"

# Vote type
class VoteType(str, Enum):
    Blacklist = "Blacklist"
    Whitelist = "Whitelist"

# Proof type
class ProofType(str, Enum):
    image = "image"
    video = "video"
    audio = "audio"

class Report(SQLModel, table=True):
    __tablename__ = "reports"
    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    title: str
    description: str
    category: Category
    detail: Optional[str] = None
    proof_file: Optional[str] = None
    proof_type: Optional[ProofType] = None
    status: Status = Field(default=Status.Draft)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    # One-to-many relationship with Vote
    votes: List["Vote"] = Relationship(back_populates="report", sa_relationship_kwargs={"cascade":"all, delete-orphan"})

class Vote(SQLModel, table=True):
    __tablename__ = "votes"
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: str
    report_id: str = Field(foreign_key="reports.id")
    vote_type: VoteType
    created_at: datetime = Field(default_factory=datetime.utcnow)

    # Many-to-one relationship with Report
    report: Optional[Report] = Relationship(back_populates="votes")

class Donate(SQLModel, table=True):
    __tablename__ = "donates"
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str
    email: str
    amount: float
    method: str
    message: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)