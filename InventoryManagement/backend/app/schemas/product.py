from typing import Optional
from pydantic import BaseModel
from datetime import datetime
from decimal import Decimal
from uuid import UUID
from app.models.product import UnitType

class UnitOfMeasureBase(BaseModel):
    name: str
    code: str
    unit_type: Optional[UnitType] = None

class UnitOfMeasureCreate(UnitOfMeasureBase):
    pass

class UnitOfMeasureResponse(UnitOfMeasureBase):
    id: UUID
    created_at: datetime

    class Config:
        from_attributes = True

class ProductCategoryBase(BaseModel):
    name: str
    code: str
    description: Optional[str] = None
    parent_category_id: Optional[UUID] = None
    is_active: bool = True

class ProductCategoryCreate(ProductCategoryBase):
    pass

class ProductCategoryResponse(ProductCategoryBase):
    id: UUID
    created_at: datetime
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True

class ProductBase(BaseModel):
    name: str
    sku: str
    barcode: Optional[str] = None
    description: Optional[str] = None
    cost_price: Decimal = 0
    selling_price: Decimal = 0
    min_stock_level: Decimal = 0
    max_stock_level: Optional[Decimal] = None
    reorder_point: Decimal = 0
    reorder_quantity: Decimal = 0
    is_active: bool = True

class ProductCreate(ProductBase):
    category_id: Optional[UUID] = None
    uom_id: UUID
    initial_stock: Optional[Decimal] = 0
    initial_stock_location_id: Optional[UUID] = None

class ProductResponse(ProductBase):
    id: UUID
    category_id: Optional[UUID]
    uom_id: UUID
    created_at: datetime
    updated_at: Optional[datetime]
    category: Optional[ProductCategoryResponse] = None
    uom: Optional[UnitOfMeasureResponse] = None

    class Config:
        from_attributes = True
