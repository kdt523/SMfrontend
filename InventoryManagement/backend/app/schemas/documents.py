from typing import Optional, List
from pydantic import BaseModel
from datetime import datetime, date
from decimal import Decimal
from uuid import UUID
from app.models.documents import (
    DocumentStatus, PickingState, PackingState, 
    TransferType, AdjustmentType, AdjustmentState
)
from app.schemas.product import ProductResponse
from app.schemas.warehouse import LocationResponse, WarehouseResponse
from app.schemas.user import UserResponse
from app.schemas.partners import SupplierResponse, CustomerResponse

# --- Common ---
class DocumentLineBase(BaseModel):
    product_id: UUID
    notes: Optional[str] = None

# --- Receipt ---
class ReceiptLineCreate(DocumentLineBase):
    location_id: UUID
    ordered_quantity: Optional[Decimal] = 0
    received_quantity: Decimal
    unit_price: Optional[Decimal] = 0

class ReceiptLineResponse(ReceiptLineCreate):
    id: UUID
    total_price: Decimal
    product: Optional[ProductResponse] = None
    location: Optional[LocationResponse] = None

    class Config:
        from_attributes = True

class ReceiptCreate(BaseModel):
    receipt_number: str
    supplier_id: Optional[UUID] = None
    warehouse_id: UUID
    location_id: UUID
    receipt_date: date
    scheduled_date: Optional[date] = None
    state: DocumentStatus = DocumentStatus.DRAFT
    reference: Optional[str] = None
    notes: Optional[str] = None
    lines: List[ReceiptLineCreate]

class ReceiptResponse(BaseModel):
    id: UUID
    receipt_number: str
    supplier_id: Optional[UUID]
    warehouse_id: UUID
    location_id: UUID
    receipt_date: date
    scheduled_date: Optional[date]
    state: DocumentStatus
    reference: Optional[str]
    notes: Optional[str]
    created_by: UUID
    validated_by: Optional[UUID]
    validated_at: Optional[datetime]
    created_at: datetime
    updated_at: Optional[datetime]
    
    lines: List[ReceiptLineResponse]
    supplier: Optional[SupplierResponse] = None
    warehouse: Optional[WarehouseResponse] = None
    location: Optional[LocationResponse] = None
    creator: Optional[UserResponse] = None
    validator: Optional[UserResponse] = None

    class Config:
        from_attributes = True

# --- Delivery Order ---
class DeliveryOrderLineCreate(DocumentLineBase):
    location_id: UUID
    ordered_quantity: Decimal
    picked_quantity: Optional[Decimal] = 0
    delivered_quantity: Optional[Decimal] = 0
    unit_price: Optional[Decimal] = 0

class DeliveryOrderLineResponse(DeliveryOrderLineCreate):
    id: UUID
    total_price: Decimal
    product: Optional[ProductResponse] = None
    location: Optional[LocationResponse] = None

    class Config:
        from_attributes = True

class DeliveryOrderCreate(BaseModel):
    delivery_number: str
    customer_id: Optional[UUID] = None
    warehouse_id: UUID
    delivery_date: date
    scheduled_date: Optional[date] = None
    state: DocumentStatus = DocumentStatus.DRAFT
    reference: Optional[str] = None
    delivery_address: Optional[str] = None
    notes: Optional[str] = None
    lines: List[DeliveryOrderLineCreate]

class DeliveryOrderResponse(BaseModel):
    id: UUID
    delivery_number: str
    customer_id: Optional[UUID]
    warehouse_id: UUID
    delivery_date: date
    scheduled_date: Optional[date]
    state: DocumentStatus
    picking_state: Optional[PickingState]
    packing_state: Optional[PackingState]
    reference: Optional[str]
    delivery_address: Optional[str]
    notes: Optional[str]
    created_by: UUID
    validated_by: Optional[UUID]
    validated_at: Optional[datetime]
    created_at: datetime
    updated_at: Optional[datetime]

    lines: List[DeliveryOrderLineResponse]
    customer: Optional[CustomerResponse] = None
    warehouse: Optional[WarehouseResponse] = None
    creator: Optional[UserResponse] = None
    validator: Optional[UserResponse] = None

    class Config:
        from_attributes = True

# --- Internal Transfer ---
class InternalTransferLineCreate(BaseModel):
    product_id: UUID
    from_location_id: UUID
    to_location_id: UUID
    quantity: Decimal
    transferred_quantity: Optional[Decimal] = 0
    notes: Optional[str] = None

class InternalTransferLineResponse(InternalTransferLineCreate):
    id: UUID
    product: Optional[ProductResponse] = None
    from_location: Optional[LocationResponse] = None
    to_location: Optional[LocationResponse] = None

    class Config:
        from_attributes = True

class InternalTransferCreate(BaseModel):
    transfer_number: str
    from_warehouse_id: UUID
    to_warehouse_id: UUID
    from_location_id: Optional[UUID] = None
    to_location_id: Optional[UUID] = None
    transfer_date: date
    scheduled_date: Optional[date] = None
    state: DocumentStatus = DocumentStatus.DRAFT
    transfer_type: Optional[TransferType] = None
    reference: Optional[str] = None
    notes: Optional[str] = None
    lines: List[InternalTransferLineCreate]

class InternalTransferResponse(BaseModel):
    id: UUID
    transfer_number: str
    from_warehouse_id: UUID
    to_warehouse_id: UUID
    from_location_id: Optional[UUID]
    to_location_id: Optional[UUID]
    transfer_date: date
    scheduled_date: Optional[date]
    state: DocumentStatus
    transfer_type: Optional[TransferType]
    reference: Optional[str]
    notes: Optional[str]
    created_by: UUID
    validated_by: Optional[UUID]
    validated_at: Optional[datetime]
    created_at: datetime
    updated_at: Optional[datetime]

    lines: List[InternalTransferLineResponse]
    from_warehouse: Optional[WarehouseResponse] = None
    to_warehouse: Optional[WarehouseResponse] = None
    from_location: Optional[LocationResponse] = None
    to_location: Optional[LocationResponse] = None
    creator: Optional[UserResponse] = None
    validator: Optional[UserResponse] = None

    class Config:
        from_attributes = True

# --- Inventory Adjustment ---
class InventoryAdjustmentLineCreate(BaseModel):
    product_id: UUID
    location_id: UUID
    system_quantity: Decimal
    counted_quantity: Decimal
    reason: Optional[str] = None
    notes: Optional[str] = None

class InventoryAdjustmentLineResponse(InventoryAdjustmentLineCreate):
    id: UUID
    difference_quantity: Decimal
    product: Optional[ProductResponse] = None
    location: Optional[LocationResponse] = None

    class Config:
        from_attributes = True

class InventoryAdjustmentCreate(BaseModel):
    adjustment_number: str
    warehouse_id: UUID
    adjustment_date: date
    adjustment_type: Optional[AdjustmentType] = None
    state: AdjustmentState = AdjustmentState.DRAFT
    reference: Optional[str] = None
    reason: Optional[str] = None
    notes: Optional[str] = None
    lines: List[InventoryAdjustmentLineCreate]

class InventoryAdjustmentResponse(BaseModel):
    id: UUID
    adjustment_number: str
    warehouse_id: UUID
    adjustment_date: date
    adjustment_type: Optional[AdjustmentType]
    state: AdjustmentState
    reference: Optional[str]
    reason: Optional[str]
    notes: Optional[str]
    created_by: UUID
    validated_by: Optional[UUID]
    validated_at: Optional[datetime]
    created_at: datetime
    updated_at: Optional[datetime]

    lines: List[InventoryAdjustmentLineResponse]
    warehouse: Optional[WarehouseResponse] = None
    creator: Optional[UserResponse] = None
    validator: Optional[UserResponse] = None

    class Config:
        from_attributes = True

    class Config:
        from_attributes = True

# --- Delivery ---
class DeliveryLineCreate(DocumentLineBase):
    requested_qty: Decimal

class DeliveryLineResponse(DeliveryLineCreate):
    id: int
    delivered_qty: Decimal
    product: Optional[ProductResponse] = None
    location: Optional[LocationResponse] = None

    class Config:
        from_attributes = True

class DeliveryCreate(BaseModel):
    customer_name: str
    reference: Optional[str] = None
    warehouse_id: int
    scheduled_date: Optional[datetime] = None
    lines: List[DeliveryLineCreate]

class DeliveryResponse(BaseModel):
    id: int
    customer_name: str
    reference: Optional[str]
    warehouse_id: int
    status: DocumentStatus
    scheduled_date: Optional[datetime]
    created_by_user_id: int
    validated_by_user_id: Optional[int]
    created_at: datetime
    updated_at: Optional[datetime]
    lines: List[DeliveryLineResponse]
    warehouse: Optional[WarehouseResponse] = None
    created_by: Optional[UserResponse] = None

    class Config:
        from_attributes = True

# --- Transfer ---
class TransferLineCreate(BaseModel):
    product_id: int
    from_location_id: int
    to_location_id: int
    quantity: Decimal

class TransferLineResponse(TransferLineCreate):
    id: int
    product: Optional[ProductResponse] = None
    from_location: Optional[LocationResponse] = None
    to_location: Optional[LocationResponse] = None

    class Config:
        from_attributes = True

class TransferCreate(BaseModel):
    from_warehouse_id: int
    to_warehouse_id: int
    scheduled_date: Optional[datetime] = None
    lines: List[TransferLineCreate]

class TransferResponse(BaseModel):
    id: int
    from_warehouse_id: int
    to_warehouse_id: int
    status: DocumentStatus
    scheduled_date: Optional[datetime]
    created_by_user_id: int
    validated_by_user_id: Optional[int]
    created_at: datetime
    updated_at: Optional[datetime]
    lines: List[TransferLineResponse]
    from_warehouse: Optional[WarehouseResponse] = None
    to_warehouse: Optional[WarehouseResponse] = None
    created_by: Optional[UserResponse] = None

    class Config:
        from_attributes = True

# --- Adjustment ---
class StockAdjustmentLineCreate(BaseModel):
    product_id: int
    location_id: int
    counted_qty: Decimal

class StockAdjustmentLineResponse(StockAdjustmentLineCreate):
    id: int
    system_qty: Decimal
    difference_qty: Decimal
    product: Optional[ProductResponse] = None
    location: Optional[LocationResponse] = None

    class Config:
        from_attributes = True

class StockAdjustmentCreate(BaseModel):
    reference: Optional[str] = None
    reason: Optional[str] = None
    lines: List[StockAdjustmentLineCreate]

class StockAdjustmentResponse(BaseModel):
    id: int
    reference: Optional[str]
    reason: Optional[str]
    status: DocumentStatus
    created_by_user_id: int
    validated_by_user_id: Optional[int]
    created_at: datetime
    updated_at: Optional[datetime]
    lines: List[StockAdjustmentLineResponse]
    created_by: Optional[UserResponse] = None

    class Config:
        from_attributes = True
