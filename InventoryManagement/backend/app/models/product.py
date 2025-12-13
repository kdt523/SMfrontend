import uuid
import enum
from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey, Text, Numeric, Enum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.db.session import Base

class UnitType(str, enum.Enum):
    UNIT = "unit"
    WEIGHT = "weight"
    VOLUME = "volume"
    LENGTH = "length"
    AREA = "area"

class ProductCategory(Base):
    __tablename__ = "product_categories"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False)
    code = Column(String(50), unique=True, nullable=False, index=True)
    description = Column(Text, nullable=True)
    parent_category_id = Column(UUID(as_uuid=True), ForeignKey("product_categories.id"), nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    parent_category = relationship("ProductCategory", remote_side=[id])

class UnitOfMeasure(Base):
    __tablename__ = "units_of_measure"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(100), nullable=False)
    code = Column(String(20), unique=True, nullable=False, index=True)
    unit_type = Column(Enum(UnitType), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class Product(Base):
    __tablename__ = "products"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False)
    sku = Column(String(100), unique=True, nullable=False, index=True)
    barcode = Column(String(100), nullable=True, index=True)
    category_id = Column(UUID(as_uuid=True), ForeignKey("product_categories.id"), nullable=True)
    uom_id = Column(UUID(as_uuid=True), ForeignKey("units_of_measure.id"), nullable=False)
    description = Column(Text, nullable=True)
    cost_price = Column(Numeric(15, 2), default=0)
    selling_price = Column(Numeric(15, 2), default=0)
    min_stock_level = Column(Numeric(15, 2), default=0)
    max_stock_level = Column(Numeric(15, 2), nullable=True)
    reorder_point = Column(Numeric(15, 2), default=0)
    reorder_quantity = Column(Numeric(15, 2), default=0)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    category = relationship("ProductCategory")
    uom = relationship("UnitOfMeasure")
