from typing import Optional
from pydantic import BaseModel
from datetime import datetime
from decimal import Decimal
from uuid import UUID
from app.models.stock import MoveType, MoveState
from app.schemas.product import ProductResponse
from app.schemas.warehouse import LocationResponse
from app.schemas.user import UserResponse

class StockQuantResponse(BaseModel):
    id: UUID
    product_id: UUID
    location_id: UUID
    quantity: Decimal
    reserved_quantity: Decimal
    available_quantity: Decimal
    last_updated: Optional[datetime]
    product: Optional[ProductResponse] = None
    location: Optional[LocationResponse] = None

    class Config:
        from_attributes = True

class StockMoveBase(BaseModel):
    product_id: UUID
    from_location_id: Optional[UUID] = None
    to_location_id: Optional[UUID] = None
    quantity: Decimal
    move_type: MoveType
    reference_type: Optional[str] = None
    reference_id: Optional[UUID] = None
    state: MoveState = MoveState.DRAFT
    scheduled_date: Optional[datetime] = None
    notes: Optional[str] = None

class StockMoveCreate(StockMoveBase):
    pass

class StockMoveResponse(StockMoveBase):
    id: UUID
    done_date: Optional[datetime]
    user_id: Optional[UUID]
    created_at: datetime
    updated_at: Optional[datetime]
    
    product: Optional[ProductResponse] = None
    from_location: Optional[LocationResponse] = None
    to_location: Optional[LocationResponse] = None
    user: Optional[UserResponse] = None

    class Config:
        from_attributes = True
