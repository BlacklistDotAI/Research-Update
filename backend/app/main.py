import uvicorn
from fastapi import FastAPI
from app.api.v1.admin_auth import router as admin_auth_router
from app.api.v1.admin_tasks import router as admin_tasks_router
from app.api.v1.admin_workers import router as admin_workers_router
from app.api.v1.admin_phones import router as admin_phones_router
from app.api.v1.client_tasks import router as client_tasks_router
from app.api.v1.client_uploads import router as client_uploads_router
from app.api.v1.client_phone import router as client_phone_router  # Nếu có
from app.api.v1.report_router import router as client_report_router
from app.api.v1.donate_router import router as client_donate_router
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

# ----------------------------
# CORS Middleware
# ----------------------------
origins = [
    "http://localhost:5173", 
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,  # hoặc ["*"] nếu không dùng credentials
    allow_credentials=True,
    allow_methods=["*"],     # GET, POST, PUT, DELETE, PATCH, OPTIONS
    allow_headers=["*"],     # tất cả headers
)

app.include_router(admin_auth_router, prefix="/api/v1")
app.include_router(admin_tasks_router, prefix="/api/v1/admin")
app.include_router(admin_workers_router, prefix="/api/v1/admin")
app.include_router(admin_phones_router, prefix="/api/v1/admin")
app.include_router(client_tasks_router, prefix="/api/v1")
app.include_router(client_uploads_router, prefix="/api/v1")
app.include_router(client_phone_router, prefix="/api/v1")
app.include_router(client_report_router, prefix="/api/v1")
app.include_router(client_donate_router, prefix="/api/v1")

@app.get("/api/ping")
async def root():
    return "pong"

if __name__ == "__main__":
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)