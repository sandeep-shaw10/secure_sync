from beanie import Document
from pydantic import BaseModel, EmailStr
from typing import List, Optional, Literal
from datetime import datetime


class Plant(Document):
    name: str
    email: EmailStr
    password_hash: str
    whitelisted_ips: List[str] = []
    is_verified: bool = False
    created_at: datetime = datetime.utcnow()

    class Settings:
        name = "plants"


class PlantData(Document):
    plant_id: str
    ip_address: str
    data_type: Literal["production_order", "inventory", "quality_report"]
    payload: dict
    timestamp: datetime = datetime.utcnow()

    class Settings:
        name = "plant_logs"


# Pydantic Schemas for Request Bodies
class CreatePlantRequest(BaseModel):
    name: str
    email: EmailStr
    password: str


class PlantLoginRequest(BaseModel):
    email: EmailStr
    password: str


class IngestDataRequest(BaseModel):
    plant_email: EmailStr  # Identifying the plant
    data_type: Literal["production_order", "inventory", "quality_report"]
    payload: dict


# --- NEW MODELS FOR ADMIN IP MANAGEMENT ---
class IPUpdateRequest(BaseModel):
    plant_email: EmailStr
    ip_address: str


# --- NEW MODEL FOR LOGIN ---
class AdminLoginRequest(BaseModel):
    username: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str