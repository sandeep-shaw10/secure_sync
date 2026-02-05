from fastapi import APIRouter, HTTPException, Depends # Import Depends
from typing import List
from ..models import Plant, CreatePlantRequest, IPUpdateRequest
from ..utils import create_verification_token, send_verification_email, get_current_admin # Import get_current_admin
from ..utils import hash_password

# --- UPDATE THIS LINE ---
# This applies the security check to ALL endpoints in this router
router = APIRouter(
    prefix="/admin", 
    tags=["Admin"],
    dependencies=[Depends(get_current_admin)] 
)

# -------------------------------
# 1. ADD NEW PLANT (Existing)
# -------------------------------
@router.post("/add-plant")
async def add_plant(plant_req: CreatePlantRequest):
    existing = await Plant.find_one(Plant.email == plant_req.email)
    if existing:
        raise HTTPException(status_code=400, detail="Plant email already registered")

    # Hash the password before saving
    hashed_pwd = hash_password(plant_req.password)

    new_plant = Plant(
        name=plant_req.name, 
        email=plant_req.email,
        password_hash=hashed_pwd # Save Hash
    )
    await new_plant.insert()

    token = create_verification_token(new_plant.email)
    send_verification_email(new_plant.email, token)

    return {"message": "Plant added with password protection.", "plant_id": str(new_plant.id)}

# -------------------------------
# 2. GET ALL PLANTS
# -------------------------------
@router.get("/plants", response_model=List[Plant])
async def get_all_plants():
    """
    Returns a list of all plants and their whitelisted IPs.
    """
    plants = await Plant.find_all().to_list()
    return plants

# -------------------------------
# 3. GET SINGLE PLANT BY EMAIL
# -------------------------------
@router.get("/plant/{email}", response_model=Plant)
async def get_plant_by_email(email: str):
    """
    Returns details for a specific plant.
    """
    plant = await Plant.find_one(Plant.email == email)
    if not plant:
        raise HTTPException(status_code=404, detail="Plant not found")
    return plant

# -------------------------------
# 4. ADD IP (Manual Update)
# -------------------------------
@router.put("/plant/ip")
async def add_ip_to_whitelist(req: IPUpdateRequest):
    """
    Manually adds an IP to a plant's whitelist.
    """
    plant = await Plant.find_one(Plant.email == req.plant_email)
    if not plant:
        raise HTTPException(status_code=404, detail="Plant not found")

    if req.ip_address in plant.whitelisted_ips:
        return {"message": f"IP {req.ip_address} is already in the whitelist."}

    plant.whitelisted_ips.append(req.ip_address)
    # If an Admin manually adds an IP, we can consider the plant "verified"
    plant.is_verified = True 
    await plant.save()

    return {
        "message": f"IP {req.ip_address} added successfully.",
        "current_ips": plant.whitelisted_ips
    }

# -------------------------------
# 5. DELETE IP
# -------------------------------
@router.delete("/plant/ip")
async def remove_ip_from_whitelist(plant_email: str, ip_address: str):
    """
    Removes a specific IP from a plant's whitelist.
    """
    plant = await Plant.find_one(Plant.email == plant_email)
    if not plant:
        raise HTTPException(status_code=404, detail="Plant not found")

    if ip_address not in plant.whitelisted_ips:
        raise HTTPException(status_code=404, detail="IP address not found in whitelist")

    plant.whitelisted_ips.remove(ip_address)
    await plant.save()

    return {
        "message": f"IP {ip_address} removed successfully.",
        "current_ips": plant.whitelisted_ips
    }