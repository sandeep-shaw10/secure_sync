from fastapi import APIRouter, HTTPException
from ..models import AdminLoginRequest, PlantLoginRequest, TokenResponse, Plant
from ..utils import create_admin_token, create_access_token, verify_password, hash_password
from ..config import settings
from ..security import crypto_manager

router = APIRouter(tags=["Auth"])

@router.post("/auth/login", response_model=TokenResponse)
async def login(login_req: AdminLoginRequest):
    # Simple check against environment variables
    if (login_req.username == settings.ADMIN_USERNAME and 
        login_req.password == settings.ADMIN_PASSWORD):
        
        token = create_admin_token(login_req.username)
        return {"access_token": token, "token_type": "Bearer"}
    
    raise HTTPException(status_code=401, detail="Invalid credentials")

# --- NEW PLANT LOGIN ---
@router.post("/auth/plant/login", response_model=TokenResponse)
async def plant_login(login_req: PlantLoginRequest):
    # 1. Find Plant
    plant = await Plant.find_one(Plant.email == login_req.email)
    if not plant:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    # 2. Verify Password
    if not verify_password(login_req.password, plant.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    # 3. Generate Token with role="plant"
    token = create_access_token(plant.email, role="plant")
    return {"access_token": token, "token_type": "Bearer"}

# --- PUBLIC KEY GENERATION ---
@router.get("/auth/public-key")
async def get_public_key():
    """
    Returns the RSA Public Key so plants can encrypt data.
    """
    return {"public_key": crypto_manager.get_public_key_pem()}