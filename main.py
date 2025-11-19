from fastapi import FastAPI
from backend.database import init_db
from backend.routers.report_router import router as report_router
from backend.routers.donate_router import router as donate_router

app = FastAPI(title="Blacklist & Donate API")

@app.on_event("startup")
async def on_startup():
    await init_db()

app.include_router(report_router)
app.include_router(donate_router)
