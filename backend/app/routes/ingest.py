from fastapi import APIRouter, Request, HTTPException, Depends
from ..models import Plant, PlantData, IngestDataRequest
from ..utils import get_current_plant  # Import the dependency

router = APIRouter(prefix="/api", tags=["Plant Data"])

@router.post("/ingest")
async def ingest_data(
    req_data: IngestDataRequest, 
    request: Request,
    current_plant_email: str = Depends(get_current_plant) # <--- 1. Enforce Token
):
    # Security Check: Ensure Token Email matches Request Email
    if current_plant_email != req_data.plant_email:
        raise HTTPException(status_code=403, detail="Token does not match plant email provided.")

    # 2. Capture IP
    client_ip = request.client.host

    # 3. Find Plant
    plant = await Plant.find_one(Plant.email == req_data.plant_email)
    if not plant:
        raise HTTPException(status_code=404, detail="Plant not found")

    # 4. Enforce IP Whitelist
    if client_ip not in plant.whitelisted_ips:
        raise HTTPException(status_code=403, detail=f"Access Denied: IP {client_ip} is not whitelisted.")

    # 5. Save Data
    log = PlantData(
        plant_id=str(plant.id),
        ip_address=client_ip,
        data_type=req_data.data_type,
        payload=req_data.payload
    )
    await log.insert()

    return {"status": "success", "message": "Data verified and logged."}