from typing import List, Any, Optional
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from datetime import datetime
from uuid import UUID

from app.api import deps
from app.models.stock import StockMove, MoveType, StockQuant
from app.models.product import Product
from app.schemas.stock import StockMoveResponse, StockQuantResponse

router = APIRouter()

@router.get("/moves", response_model=List[StockMoveResponse])
async def read_stock_moves(
    skip: int = 0,
    limit: int = 100,
    product_id: Optional[UUID] = None,
    location_id: Optional[UUID] = None,
    move_type: Optional[MoveType] = None,
    date_from: Optional[datetime] = None,
    date_to: Optional[datetime] = None,
    db: AsyncSession = Depends(deps.get_db),
    current_user = Depends(deps.get_current_user)
) -> Any:
    query = select(StockMove).options(
        selectinload(StockMove.product).selectinload(Product.category),
        selectinload(StockMove.product).selectinload(Product.uom),
        selectinload(StockMove.from_location),
        selectinload(StockMove.to_location),
        selectinload(StockMove.user)
    )
    
    if product_id:
        query = query.where(StockMove.product_id == product_id)
    if location_id:
        query = query.where((StockMove.from_location_id == location_id) | (StockMove.to_location_id == location_id))
    if move_type:
        query = query.where(StockMove.move_type == move_type)
    if date_from:
        query = query.where(StockMove.created_at >= date_from)
    if date_to:
        query = query.where(StockMove.created_at <= date_to)
        
    query = query.order_by(StockMove.created_at.desc()).offset(skip).limit(limit)
    
    result = await db.execute(query)
    return result.scalars().all()

@router.get("/quants", response_model=List[StockQuantResponse])
async def read_stock_quants(
    skip: int = 0,
    limit: int = 100,
    product_id: Optional[UUID] = None,
    location_id: Optional[UUID] = None,
    db: AsyncSession = Depends(deps.get_db),
    current_user = Depends(deps.get_current_user)
) -> Any:
    query = select(StockQuant).options(
        selectinload(StockQuant.product).selectinload(Product.category),
        selectinload(StockQuant.product).selectinload(Product.uom),
        selectinload(StockQuant.location)
    )
    
    if product_id:
        query = query.where(StockQuant.product_id == product_id)
    if location_id:
        query = query.where(StockQuant.location_id == location_id)
        
    query = query.offset(skip).limit(limit)
    
    result = await db.execute(query)
    return result.scalars().all()
