from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie
from .models import Plant, PlantData
from .config import settings

async def init_db():
    client = AsyncIOMotorClient(settings.MONGODB_URL)
    await init_beanie(database=client[settings.DB_NAME], document_models=[Plant, PlantData])