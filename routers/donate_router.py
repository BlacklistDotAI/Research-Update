from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
from backend.database import get_session
from backend.models import Donate
from backend.schemas import DonateCreate, DonateRead

router = APIRouter(prefix="/donates", tags=["Donate"])

@router.post("/", response_model=DonateRead)
async def create_donate(donate_in: DonateCreate, session: AsyncSession = Depends(get_session)):
    donate = Donate(**donate_in.dict())
    session.add(donate)
    await session.commit()
    await session.refresh(donate)
    return donate

@router.get("/", response_model=List[DonateRead])
async def list_donates(session: AsyncSession = Depends(get_session)):
    result = await session.execute(select(Donate))
    return result.scalars().all()
