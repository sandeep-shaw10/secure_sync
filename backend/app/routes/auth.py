from fastapi import APIRouter, HTTPException
from ..models import AdminLoginRequest, TokenResponse
from ..utils import create_admin_token
from ..config import settings

router = APIRouter(tags=["Auth"])

@router.post("/auth/login", response_model=TokenResponse)
async def login(login_req: AdminLoginRequest):
    # Simple check against environment variables
    if (login_req.username == settings.ADMIN_USERNAME and 
        login_req.password == settings.ADMIN_PASSWORD):
        
        token = create_admin_token(login_req.username)
        return {"access_token": token, "token_type": "Bearer"}
    
    raise HTTPException(status_code=401, detail="Invalid credentials")