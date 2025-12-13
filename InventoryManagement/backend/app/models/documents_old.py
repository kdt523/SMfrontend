import enum
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Numeric, Enum
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.db.session import Base

class DocumentStatus(str, enum.Enum):
    DRAFT = "DRAFT"
    WAITING = "WAITING"
    READY = "READY"
    DONE = "DONE"
    CANCELED = "CANCELED"

# --- Receipts ---
class Receipt(Base):
    __tablename__ = "receipts"

    id = Column(Integer, primary_key=True, index=True)
    vendor_name = Column(String, nullable=False)
    reference = Column(String, nullable=True)
    warehouse_id = Column(Integer, ForeignKey("warehouses.id"), nullable=False)
    status = Column(Enum(DocumentStatus), default=DocumentStatus.DRAFT, nullable=False)
    scheduled_date = Column(DateTime(timezone=True), nullable=True)
    created_by_user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    validated_by_user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    warehouse = relationship("Warehouse")
    lines = relationship("ReceiptLine", back_populates="receipt", cascade="all, delete-orphan")
    created_by = relationship("User", foreign_keys=[created_by_user_id])

class ReceiptLine(Base):
    __tablename__ = "receipt_lines"

    id = Column(Integer, primary_key=True, index=True)
    receipt_id = Column(Integer, ForeignKey("receipts.id"), nullable=False)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    location_id = Column(Integer, ForeignKey("locations.id"), nullable=False)
    ordered_qty = Column(Numeric(10, 2), default=0)
    received_qty = Column(Numeric(10, 2), default=0)
    remarks = Column(String, nullable=True)

    receipt = relationship("Receipt", back_populates="lines")
    product = relationship("Product")
    location = relationship("Location")

# --- Deliveries ---
class Delivery(Base):
    __tablename__ = "deliveries"

    id = Column(Integer, primary_key=True, index=True)
    customer_name = Column(String, nullable=False)
    reference = Column(String, nullable=True)
    warehouse_id = Column(Integer, ForeignKey("warehouses.id"), nullable=False)
    status = Column(Enum(DocumentStatus), default=DocumentStatus.DRAFT, nullable=False)
    scheduled_date = Column(DateTime(timezone=True), nullable=True)
    created_by_user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    validated_by_user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    warehouse = relationship("Warehouse")
    lines = relationship("DeliveryLine", back_populates="delivery", cascade="all, delete-orphan")
    created_by = relationship("User", foreign_keys=[created_by_user_id])

class DeliveryLine(Base):
    __tablename__ = "delivery_lines"

    id = Column(Integer, primary_key=True, index=True)
    delivery_id = Column(Integer, ForeignKey("deliveries.id"), nullable=False)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    location_id = Column(Integer, ForeignKey("locations.id"), nullable=False)
    requested_qty = Column(Numeric(10, 2), default=0)
    delivered_qty = Column(Numeric(10, 2), default=0)

    delivery = relationship("Delivery", back_populates="lines")
    product = relationship("Product")
    location = relationship("Location")

# --- Transfers ---
class Transfer(Base):
    __tablename__ = "transfers"

    id = Column(Integer, primary_key=True, index=True)
    from_warehouse_id = Column(Integer, ForeignKey("warehouses.id"), nullable=False)
    to_warehouse_id = Column(Integer, ForeignKey("warehouses.id"), nullable=False)
    status = Column(Enum(DocumentStatus), default=DocumentStatus.DRAFT, nullable=False)
    scheduled_date = Column(DateTime(timezone=True), nullable=True)
    created_by_user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    validated_by_user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    from_warehouse = relationship("Warehouse", foreign_keys=[from_warehouse_id])
    to_warehouse = relationship("Warehouse", foreign_keys=[to_warehouse_id])
    lines = relationship("TransferLine", back_populates="transfer", cascade="all, delete-orphan")
    created_by = relationship("User", foreign_keys=[created_by_user_id])

class TransferLine(Base):
    __tablename__ = "transfer_lines"

    id = Column(Integer, primary_key=True, index=True)
    transfer_id = Column(Integer, ForeignKey("transfers.id"), nullable=False)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    from_location_id = Column(Integer, ForeignKey("locations.id"), nullable=False)
    to_location_id = Column(Integer, ForeignKey("locations.id"), nullable=False)
    quantity = Column(Numeric(10, 2), default=0)

    transfer = relationship("Transfer", back_populates="lines")
    product = relationship("Product")
    from_location = relationship("Location", foreign_keys=[from_location_id])
    to_location = relationship("Location", foreign_keys=[to_location_id])

# --- Adjustments ---
class StockAdjustment(Base):
    __tablename__ = "stock_adjustments"

    id = Column(Integer, primary_key=True, index=True)
    reference = Column(String, nullable=True)
    reason = Column(String, nullable=True)
    status = Column(Enum(DocumentStatus), default=DocumentStatus.DRAFT, nullable=False)
    created_by_user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    validated_by_user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    lines = relationship("StockAdjustmentLine", back_populates="adjustment", cascade="all, delete-orphan")
    created_by = relationship("User", foreign_keys=[created_by_user_id])

class StockAdjustmentLine(Base):
    __tablename__ = "stock_adjustment_lines"

    id = Column(Integer, primary_key=True, index=True)
    adjustment_id = Column(Integer, ForeignKey("stock_adjustments.id"), nullable=False)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    location_id = Column(Integer, ForeignKey("locations.id"), nullable=False)
    counted_qty = Column(Numeric(10, 2), default=0)
    system_qty = Column(Numeric(10, 2), default=0)
    difference_qty = Column(Numeric(10, 2), default=0)

    adjustment = relationship("StockAdjustment", back_populates="lines")
    product = relationship("Product")
    location = relationship("Location")
