from fastapi import FastAPI
from .database import init_db
from .routes import admin, verification, ingest, auth  # Import auth

app = FastAPI(title="Secure Plant Dashboard")

@app.on_event("startup")
async def start_db():
    await init_db()

# Register the new router
app.include_router(auth.router)  # <--- NEW
app.include_router(admin.router)
app.include_router(verification.router)
app.include_router(ingest.router)

@app.get("/")
def home():
    return {"message": "Admin Homepage API Running"}