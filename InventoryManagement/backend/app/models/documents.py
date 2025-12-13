import uuid
import enum
from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey, Text, Numeric, Enum, Date
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.db.session import Base

class DocumentStatus(str, enum.Enum):
    DRAFT = "draft"
    WAITING = "waiting"
    READY = "ready"
    DONE = "done"
    CANCELLED = "cancelled"

class PickingState(str, enum.Enum):
    PENDING = "pending"
    PARTIAL = "partial"
    DONE = "done"

class PackingState(str, enum.Enum):
    PENDING = "pending"
    PARTIAL = "partial"
    DONE = "done"

class TransferType(str, enum.Enum):
    WAREHOUSE_TRANSFER = "warehouse_transfer"
    LOCATION_TRANSFER = "location_transfer"
    PRODUCTION = "production"

class AdjustmentType(str, enum.Enum):
    PHYSICAL_COUNT = "physical_count"
    DAMAGE = "damage"
    LOSS = "loss"
    FOUND = "found"
    CORRECTION = "correction"

class AdjustmentState(str, enum.Enum):
    DRAFT = "draft"
    DONE = "done"
    CANCELLED = "cancelled"

# --- Receipts ---
class Receipt(Base):
    __tablename__ = "receipts"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    receipt_number = Column(String(100), unique=True, nullable=False, index=True)
    supplier_id = Column(UUID(as_uuid=True), ForeignKey("suppliers.id"), nullable=True)
    warehouse_id = Column(UUID(as_uuid=True), ForeignKey("warehouses.id"), nullable=False)
    location_id = Column(UUID(as_uuid=True), ForeignKey("locations.id"), nullable=False)
    receipt_date = Column(Date, nullable=False)
    scheduled_date = Column(Date, nullable=True)
    state = Column(Enum(DocumentStatus), nullable=False)
    reference = Column(String(255), nullable=True)
    notes = Column(Text, nullable=True)
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    validated_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    validated_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    supplier = relationship("app.models.partners.Supplier")
    warehouse = relationship("app.models.warehouse.Warehouse")
    location = relationship("app.models.warehouse.Location")
    creator = relationship("app.models.user.User", foreign_keys=[created_by])
    validator = relationship("app.models.user.User", foreign_keys=[validated_by])
    lines = relationship("ReceiptLine", back_populates="receipt", cascade="all, delete-orphan")

class ReceiptLine(Base):
    __tablename__ = "receipt_lines"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    receipt_id = Column(UUID(as_uuid=True), ForeignKey("receipts.id"), nullable=False)
    product_id = Column(UUID(as_uuid=True), ForeignKey("products.id"), nullable=False)
    location_id = Column(UUID(as_uuid=True), ForeignKey("locations.id"), nullable=False)
    ordered_quantity = Column(Numeric(15, 2), default=0)
    received_quantity = Column(Numeric(15, 2), nullable=False)
    unit_price = Column(Numeric(15, 2), default=0)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    receipt = relationship("Receipt", back_populates="lines")
    product = relationship("app.models.product.Product")
    location = relationship("app.models.warehouse.Location")

    @property
    def total_price(self):
        return self.received_quantity * self.unit_price

# --- Delivery Orders ---
class DeliveryOrder(Base):
    __tablename__ = "delivery_orders"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    delivery_number = Column(String(100), unique=True, nullable=False, index=True)
    customer_id = Column(UUID(as_uuid=True), ForeignKey("customers.id"), nullable=True)
    warehouse_id = Column(UUID(as_uuid=True), ForeignKey("warehouses.id"), nullable=False)
    delivery_date = Column(Date, nullable=False)
    scheduled_date = Column(Date, nullable=True)
    state = Column(Enum(DocumentStatus), nullable=False)
    picking_state = Column(Enum(PickingState), nullable=True)
    packing_state = Column(Enum(PackingState), nullable=True)
    reference = Column(String(255), nullable=True)
    delivery_address = Column(Text, nullable=True)
    notes = Column(Text, nullable=True)
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    validated_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    validated_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    customer = relationship("app.models.partners.Customer")
    warehouse = relationship("app.models.warehouse.Warehouse")
    creator = relationship("app.models.user.User", foreign_keys=[created_by])
    validator = relationship("app.models.user.User", foreign_keys=[validated_by])
    lines = relationship("DeliveryOrderLine", back_populates="delivery_order", cascade="all, delete-orphan")

class DeliveryOrderLine(Base):
    __tablename__ = "delivery_order_lines"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    delivery_order_id = Column(UUID(as_uuid=True), ForeignKey("delivery_orders.id"), nullable=False)
    product_id = Column(UUID(as_uuid=True), ForeignKey("products.id"), nullable=False)
    location_id = Column(UUID(as_uuid=True), ForeignKey("locations.id"), nullable=False)
    ordered_quantity = Column(Numeric(15, 2), nullable=False)
    picked_quantity = Column(Numeric(15, 2), default=0)
    delivered_quantity = Column(Numeric(15, 2), default=0)
    unit_price = Column(Numeric(15, 2), default=0)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    delivery_order = relationship("DeliveryOrder", back_populates="lines")
    product = relationship("app.models.product.Product")
    location = relationship("app.models.warehouse.Location")

    @property
    def total_price(self):
        return self.delivered_quantity * self.unit_price

# --- Internal Transfers ---
class InternalTransfer(Base):
    __tablename__ = "internal_transfers"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    transfer_number = Column(String(100), unique=True, nullable=False, index=True)
    from_warehouse_id = Column(UUID(as_uuid=True), ForeignKey("warehouses.id"), nullable=False)
    to_warehouse_id = Column(UUID(as_uuid=True), ForeignKey("warehouses.id"), nullable=False)
    from_location_id = Column(UUID(as_uuid=True), ForeignKey("locations.id"), nullable=True)
    to_location_id = Column(UUID(as_uuid=True), ForeignKey("locations.id"), nullable=True)
    transfer_date = Column(Date, nullable=False)
    scheduled_date = Column(Date, nullable=True)
    state = Column(Enum(DocumentStatus), nullable=False)
    transfer_type = Column(Enum(TransferType), nullable=True)
    reference = Column(String(255), nullable=True)
    notes = Column(Text, nullable=True)
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    validated_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    validated_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    from_warehouse = relationship("app.models.warehouse.Warehouse", foreign_keys=[from_warehouse_id])
    to_warehouse = relationship("app.models.warehouse.Warehouse", foreign_keys=[to_warehouse_id])
    from_location = relationship("app.models.warehouse.Location", foreign_keys=[from_location_id])
    to_location = relationship("app.models.warehouse.Location", foreign_keys=[to_location_id])
    creator = relationship("app.models.user.User", foreign_keys=[created_by])
    validator = relationship("app.models.user.User", foreign_keys=[validated_by])
    lines = relationship("InternalTransferLine", back_populates="transfer", cascade="all, delete-orphan")

class InternalTransferLine(Base):
    __tablename__ = "internal_transfer_lines"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    transfer_id = Column(UUID(as_uuid=True), ForeignKey("internal_transfers.id"), nullable=False)
    product_id = Column(UUID(as_uuid=True), ForeignKey("products.id"), nullable=False)
    from_location_id = Column(UUID(as_uuid=True), ForeignKey("locations.id"), nullable=False)
    to_location_id = Column(UUID(as_uuid=True), ForeignKey("locations.id"), nullable=False)
    quantity = Column(Numeric(15, 2), nullable=False)
    transferred_quantity = Column(Numeric(15, 2), default=0)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    transfer = relationship("InternalTransfer", back_populates="lines")
    product = relationship("app.models.product.Product")
    from_location = relationship("app.models.warehouse.Location", foreign_keys=[from_location_id])
    to_location = relationship("app.models.warehouse.Location", foreign_keys=[to_location_id])

# --- Inventory Adjustments ---
class InventoryAdjustment(Base):
    __tablename__ = "inventory_adjustments"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    adjustment_number = Column(String(100), unique=True, nullable=False, index=True)
    warehouse_id = Column(UUID(as_uuid=True), ForeignKey("warehouses.id"), nullable=False)
    adjustment_date = Column(Date, nullable=False)
    adjustment_type = Column(Enum(AdjustmentType), nullable=True)
    state = Column(Enum(AdjustmentState), nullable=False)
    reference = Column(String(255), nullable=True)
    reason = Column(Text, nullable=True)
    notes = Column(Text, nullable=True)
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    validated_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    validated_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    warehouse = relationship("app.models.warehouse.Warehouse")
    creator = relationship("app.models.user.User", foreign_keys=[created_by])
    validator = relationship("app.models.user.User", foreign_keys=[validated_by])
    lines = relationship("InventoryAdjustmentLine", back_populates="adjustment", cascade="all, delete-orphan")

class InventoryAdjustmentLine(Base):
    __tablename__ = "inventory_adjustment_lines"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    adjustment_id = Column(UUID(as_uuid=True), ForeignKey("inventory_adjustments.id"), nullable=False)
    product_id = Column(UUID(as_uuid=True), ForeignKey("products.id"), nullable=False)
    location_id = Column(UUID(as_uuid=True), ForeignKey("locations.id"), nullable=False)
    system_quantity = Column(Numeric(15, 2), nullable=False)
    counted_quantity = Column(Numeric(15, 2), nullable=False)
    reason = Column(Text, nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    adjustment = relationship("InventoryAdjustment", back_populates="lines")
    product = relationship("app.models.product.Product")
    location = relationship("app.models.warehouse.Location")

    @property
    def difference_quantity(self):
        return self.counted_quantity - self.system_quantity
