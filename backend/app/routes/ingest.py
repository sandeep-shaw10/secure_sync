from fastapi import APIRouter, Request, HTTPException, Depends
from ..models import Plant, PlantData, IngestDataRequest

router = APIRouter(prefix="/api", tags=["Plant Data"])

@router.post("/ingest")
async def ingest_data(req_data: IngestDataRequest, request: Request):
    # 1. Capture Incoming IP
    client_ip = request.client.host

    # 2. Find Plant
    plant = await Plant.find_one(Plant.email == req_data.plant_email)
    if not plant:
        raise HTTPException(status_code=404, detail="Plant not found")

    # 3. SECURITY CHECK: Is this IP whitelisted?
    if client_ip not in plant.whitelisted_ips:
        raise HTTPException(status_code=403, detail=f"Access Denied: IP {client_ip} is not whitelisted for this plant.")

    # 4. Save Data
    log = PlantData(
        plant_id=str(plant.id),
        ip_address=client_ip,
        data_type=req_data.data_type,
        payload=req_data.payload
    )
    await log.insert()

    return {"status": "success", "message": "Data logged successfully"}