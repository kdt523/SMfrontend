from typing import Optional, List
from pydantic import BaseModel
from datetime import datetime
from uuid import UUID
from app.models.warehouse import LocationType

class LocationBase(BaseModel):
    name: str
    code: str
    location_type: Optional[LocationType] = None
    parent_location_id: Optional[UUID] = None
    is_active: bool = True

class LocationCreate(LocationBase):
    warehouse_id: UUID

class LocationResponse(LocationBase):
    id: UUID
    warehouse_id: UUID
    created_at: datetime
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True

class WarehouseBase(BaseModel):
    name: str
    code: str
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    country: Optional[str] = None
    postal_code: Optional[str] = None
    is_active: bool = True

class WarehouseCreate(WarehouseBase):
    pass

class WarehouseResponse(WarehouseBase):
    id: UUID
    created_at: datetime
    updated_at: Optional[datetime]
    locations: List[LocationResponse] = []

    class Config:
        from_attributes = True
