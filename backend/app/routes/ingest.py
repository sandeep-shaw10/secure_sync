from fastapi import APIRouter, Request, HTTPException, Depends, UploadFile, File, Form
from ..models import Plant
from ..utils import get_current_plant
from ..security import crypto_manager
from ..database import get_grid_fs
import json
import base64

router = APIRouter(prefix="/api", tags=["Plant Data"])

# --- STREAMING INGEST (For Large Files up to 50MB) ---
@router.post("/ingest/stream")
async def ingest_stream(
    plant_email: str = Form(...),
    encrypted_aes_key: str = Form(...),
    iv: str = Form(...),
    file: UploadFile = File(...),
    request: Request = None,  # <--- ADD REQUEST HERE
    current_plant_email: str = Depends(get_current_plant)
):
    # 1. Security Check: Token vs Form Email
    if current_plant_email != plant_email:
        raise HTTPException(status_code=403, detail="Token mismatch.")

    # 2. Security Check: IP Whitelist (FIXED)
    client_ip = request.client.host
    plant = await Plant.find_one(Plant.email == plant_email)
    
    if not plant:
        raise HTTPException(status_code=404, detail="Plant not found")

    # --- THE MISSING CHECK ---
    if client_ip not in plant.whitelisted_ips:
        raise HTTPException(status_code=403, detail=f"Access Denied: IP {client_ip} is not whitelisted.")
    # -------------------------
    
    fs = get_grid_fs()
    
    try:
        # 3. Read the Encrypted File into Memory
        # (For 50MB, reading into memory is acceptable. For larger, we'd stream-decrypt)
        encrypted_data = await file.read()

        # 4. DECRYPTION
        # We need to encode to base64 string because your crypto_manager expects strings
        encrypted_b64 = base64.b64encode(encrypted_data).decode('utf-8')

        decrypted_str = crypto_manager.decrypt_payload(
            encrypted_aes_key,
            iv,
            encrypted_b64
        )
        
        if not decrypted_str:
            raise HTTPException(status_code=400, detail="Decryption Failed.")

        # 5. Store in GridFS (The "Lake")
        # We store the raw decrypted content (JSON or File)
        file_id = await fs.upload_from_stream(
            filename=f"{plant_email}_{file.filename}",
            source=decrypted_str.encode('utf-8'),
            metadata={"plant": plant_email, "type": "secure_upload"}
        )

        return {
            "status": "success", 
            "message": "Large Payload Securely Decrypted & Stored",
            "file_id": str(file_id),
            "size_stored": len(decrypted_str)
        }

    except Exception as e:
        print(f"Upload Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))