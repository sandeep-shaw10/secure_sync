from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie
from motor.motor_asyncio import AsyncIOMotorGridFSBucket  # <-- Import This
from .models import Plant, PlantData

client = None
grid_fs = None  # Global GridFS instance

async def init_db():
    global client, grid_fs
    # Update with your actual Mongo URL if different
    client = AsyncIOMotorClient("mongodb://mongodb:27017")
    
    # Initialize Beanie (ODM)
    await init_beanie(database=client.secure_sync, document_models=[Plant, PlantData])
    
    # Initialize GridFS Bucket
    db = client.secure_sync
    grid_fs = AsyncIOMotorGridFSBucket(db)
    print("✅ Database & GridFS Initialized")

def get_grid_fs():
    return grid_fs