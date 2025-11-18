from fastapi import FastAPI
from backend.database import init_db
from backend.routers import report_router, donate_router

app = FastAPI(title="Blacklist + Donate API")

app.include_router(report_router.router)
app.include_router(donate_router.router)

@app.on_event("startup")
async def on_startup():
    await init_db()
