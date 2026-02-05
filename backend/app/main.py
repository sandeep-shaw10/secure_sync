from fastapi import FastAPI
from .database import init_db
from .routes import admin, verification, ingest

app = FastAPI(title="Secure Plant Dashboard")

@app.on_event("startup")
async def start_db():
    await init_db()

app.include_router(admin.router)
app.include_router(verification.router)
app.include_router(ingest.router)

@app.get("/")
def home():
    return {"message": "Admin Dashboard API Running"}