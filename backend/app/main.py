from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager  # <--- NEW IMPORT
from .database import init_db
from .routes import admin, verification, ingest, auth

# --- LIFESPAN MANAGER (Replaces on_event) ---
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup logic
    await init_db()
    yield
    # Shutdown logic (if needed) goes here
    # e.g., await close_db_connection()

# --- APP INITIALIZATION ---
# Pass the lifespan function here
app = FastAPI(title="Secure Plant Dashboard", lifespan=lifespan)

# --- CORS CONFIGURATION ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all for your demo
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- ROUTERS ---
app.include_router(auth.router)
app.include_router(admin.router)
app.include_router(verification.router)
app.include_router(ingest.router)

@app.get("/")
def home():
    return {"message": "Admin Dashboard API Running"}