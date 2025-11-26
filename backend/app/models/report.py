from sqlalchemy import Column, Integer, String, DateTime, Enum,Text,ForeignKey,Float,Boolean
from pydantic import EmailStr
import enum
from datetime import datetime, timezone
import uuid
from app.core.postgres_client import Base
from sqlalchemy.sql import func
# Report categories
class Category(enum.Enum):
    Phone_Number = "Phone Number"
    Personnel_KOL = "Personnel/KOL"
    Company = "Company"
    Event = "Event"

# Report status
class Status(enum.Enum):
    Draft = "Draft"
    Publish = "Publish"
    Blacklist = "Blacklist"

# Proof type
class ProofType(enum.Enum):
    image = "image"
    video = "video"
    audio = "audio"

class Report(Base):
    __tablename__ = "reports"
    __allow_unmapped__ = True
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    title = Column(String(100), nullable=False, index=True)
    description = Column(Text, nullable=False)
    category = Column(Enum(Category), nullable=False)
    detail = Column(Text, nullable=True)
    proof_file = Column(String, nullable=True)
    proof_type = Column(Enum(ProofType), nullable=True)
    status = Column(Enum(Status), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

