from typing import List, Any
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.api import deps
from app.models.warehouse import Warehouse, Location
from app.schemas.warehouse import WarehouseCreate, WarehouseResponse, LocationCreate, LocationResponse

router = APIRouter()

# --- Warehouses ---
@router.get("", response_model=List[WarehouseResponse])
async def read_warehouses(
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(deps.get_db),
    current_user = Depends(deps.get_current_user)
) -> Any:
    result = await db.execute(
        select(Warehouse)
        .options(selectinload(Warehouse.locations))
        .offset(skip)
        .limit(limit)
    )
    return result.scalars().all()

@router.post("", response_model=WarehouseResponse)
async def create_warehouse(
    warehouse_in: WarehouseCreate,
    db: AsyncSession = Depends(deps.get_db),
    current_user = Depends(deps.get_current_user)
) -> Any:
    warehouse = Warehouse(**warehouse_in.model_dump())
    db.add(warehouse)
    await db.commit()
    await db.refresh(warehouse)
    return warehouse

# --- Locations ---
@router.get("/locations", response_model=List[LocationResponse])
async def read_locations(
    skip: int = 0,
    limit: int = 100,
    warehouse_id: str = None,
    db: AsyncSession = Depends(deps.get_db),
    current_user = Depends(deps.get_current_user)
) -> Any:
    query = select(Location)
    if warehouse_id:
        query = query.where(Location.warehouse_id == warehouse_id)
    
    result = await db.execute(query.offset(skip).limit(limit))
    return result.scalars().all()
    if warehouse_id:
        query = query.where(Location.warehouse_id == warehouse_id)
    
    result = await db.execute(query.offset(skip).limit(limit))
    return result.scalars().all()

@router.post("/locations", response_model=LocationResponse)
async def create_location(
    location_in: LocationCreate,
    db: AsyncSession = Depends(deps.get_db),
    current_user = Depends(deps.get_current_user)
) -> Any:
    location = Location(**location_in.model_dump())
    db.add(location)
    await db.commit()
    await db.refresh(location)
    return location
