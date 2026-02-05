from fastapi import APIRouter, Request, HTTPException
from ..models import Plant
from ..utils import decode_verification_token

router = APIRouter(tags=["Verification"])

@router.get("/verify")
async def verify_plant_ip(token: str, request: Request):
    # 1. Validate Token (Check 10 min expiry)
    email = decode_verification_token(token)
    if not email:
        raise HTTPException(status_code=400, detail="Link expired or invalid")

    # 2. Find Plant
    plant = await Plant.find_one(Plant.email == email)
    if not plant:
        raise HTTPException(status_code=404, detail="Plant not found")

    # 3. Capture IP Address
    # Note: In Docker/Reverse Proxy, you might need X-Forwarded-For header
    client_ip = request.client.host
    
    # 4. Add IP to Whitelist if not present
    if client_ip not in plant.whitelisted_ips:
        plant.whitelisted_ips.append(client_ip)
        plant.is_verified = True
        await plant.save()
        return {"message": f"Success! IP {client_ip} has been whitelisted for {plant.name}."}
    
    return {"message": f"IP {client_ip} is already whitelisted."}