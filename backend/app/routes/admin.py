from fastapi import APIRouter, HTTPException
from ..models import Plant, CreatePlantRequest
from ..utils import create_verification_token, send_verification_email

router = APIRouter(prefix="/admin", tags=["Admin"])

@router.post("/add-plant")
async def add_plant(plant_req: CreatePlantRequest):
    # 1. Check if exists
    existing = await Plant.find_one(Plant.email == plant_req.email)
    if existing:
        raise HTTPException(status_code=400, detail="Plant email already registered")

    # 2. Create Plant
    new_plant = Plant(name=plant_req.name, email=plant_req.email)
    await new_plant.insert()

    # 3. Generate 10-min Token
    token = create_verification_token(new_plant.email)

    # 4. Send Email
    send_verification_email(new_plant.email, token)

    return {"message": "Plant added and verification email sent.", "plant_id": str(new_plant.id)}