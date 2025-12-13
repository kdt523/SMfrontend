import uuid
import enum
from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey, Text, Numeric, Enum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.db.session import Base

class MoveType(str, enum.Enum):
    RECEIPT = "receipt"
    DELIVERY = "delivery"
    INTERNAL = "internal"
    ADJUSTMENT = "adjustment"

class MoveState(str, enum.Enum):
    DRAFT = "draft"
    WAITING = "waiting"
    CONFIRMED = "confirmed"
    DONE = "done"
    CANCELLED = "cancelled"

class StockQuant(Base):
    __tablename__ = "stock_quants"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    product_id = Column(UUID(as_uuid=True), ForeignKey("products.id"), nullable=False)
    location_id = Column(UUID(as_uuid=True), ForeignKey("locations.id"), nullable=False)
    quantity = Column(Numeric(15, 2), nullable=False)
    reserved_quantity = Column(Numeric(15, 2), default=0, nullable=False)
    # available_quantity is computed, usually not stored unless using generated columns. 
    # SQLAlchemy supports Computed column but it depends on DB support. Postgres supports it.
    # But user spec says COMPUTED. I'll skip it in model definition as a column if I can use property, 
    # or use Computed() if I want it in DB.
    # Let's use property for now or just rely on query. 
    # Actually, user spec says "COMPUTED quantity - reserved_quantity". 
    # I will add it as a property in Python, but not a column in DB unless I use Computed.
    # Let's stick to Python property for simplicity unless performance is needed.
    
    last_updated = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    product = relationship("app.models.product.Product")
    location = relationship("app.models.warehouse.Location")

    @property
    def available_quantity(self):
        return self.quantity - self.reserved_quantity

class StockMove(Base):
    __tablename__ = "stock_moves"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    product_id = Column(UUID(as_uuid=True), ForeignKey("products.id"), nullable=False)
    from_location_id = Column(UUID(as_uuid=True), ForeignKey("locations.id"), nullable=True)
    to_location_id = Column(UUID(as_uuid=True), ForeignKey("locations.id"), nullable=True)
    quantity = Column(Numeric(15, 2), nullable=False)
    move_type = Column(Enum(MoveType), nullable=False)
    reference_type = Column(String(50), nullable=True)
    reference_id = Column(UUID(as_uuid=True), nullable=True)
    state = Column(Enum(MoveState), nullable=False)
    scheduled_date = Column(DateTime(timezone=True), nullable=True)
    done_date = Column(DateTime(timezone=True), nullable=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    product = relationship("app.models.product.Product")
    from_location = relationship("app.models.warehouse.Location", foreign_keys=[from_location_id])
    to_location = relationship("app.models.warehouse.Location", foreign_keys=[to_location_id])
    user = relationship("app.models.user.User")
