from typing import List, Any
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.api import deps
from app.models.documents import InventoryAdjustment, InventoryAdjustmentLine, AdjustmentState
from app.models.product import Product
from app.models.warehouse import Warehouse
from app.schemas.documents import InventoryAdjustmentCreate, InventoryAdjustmentResponse

router = APIRouter()

@router.get("", response_model=List[InventoryAdjustmentResponse])
async def read_adjustments(
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(deps.get_db),
    current_user = Depends(deps.get_current_user)
) -> Any:
    result = await db.execute(
        select(InventoryAdjustment)
        .options(
            selectinload(InventoryAdjustment.lines).selectinload(InventoryAdjustmentLine.product).selectinload(Product.category),
            selectinload(InventoryAdjustment.lines).selectinload(InventoryAdjustmentLine.product).selectinload(Product.uom),
            selectinload(InventoryAdjustment.lines).selectinload(InventoryAdjustmentLine.location),
            selectinload(InventoryAdjustment.warehouse).selectinload(Warehouse.locations),
            selectinload(InventoryAdjustment.creator),
            selectinload(InventoryAdjustment.validator)
        )
        .offset(skip)
        .limit(limit)
    )
    return result.scalars().all()

@router.post("", response_model=InventoryAdjustmentResponse)
async def create_adjustment(
    adjustment_in: InventoryAdjustmentCreate,
    db: AsyncSession = Depends(deps.get_db),
    current_user = Depends(deps.get_current_user)
) -> Any:
    adjustment = InventoryAdjustment(
        adjustment_number=adjustment_in.adjustment_number,
        warehouse_id=adjustment_in.warehouse_id,
        adjustment_date=adjustment_in.adjustment_date,
        adjustment_type=adjustment_in.adjustment_type,
        reference=adjustment_in.reference,
        reason=adjustment_in.reason,
        notes=adjustment_in.notes,
        created_by=current_user.id,
        state=AdjustmentState.DRAFT
    )
    db.add(adjustment)
    await db.flush()

    for line_in in adjustment_in.lines:
        line = InventoryAdjustmentLine(
            adjustment_id=adjustment.id,
            product_id=line_in.product_id,
            location_id=line_in.location_id,
            system_quantity=line_in.system_quantity,
            counted_quantity=line_in.counted_quantity,
            reason=line_in.reason,
            notes=line_in.notes
        )
        db.add(line)
    
    await db.commit()
    await db.refresh(adjustment)
    
    result = await db.execute(
        select(InventoryAdjustment)
        .where(InventoryAdjustment.id == adjustment.id)
        .options(
            selectinload(InventoryAdjustment.lines).selectinload(InventoryAdjustmentLine.product).selectinload(Product.category),
            selectinload(InventoryAdjustment.lines).selectinload(InventoryAdjustmentLine.product).selectinload(Product.uom),
            selectinload(InventoryAdjustment.lines).selectinload(InventoryAdjustmentLine.location),
            selectinload(InventoryAdjustment.warehouse).selectinload(Warehouse.locations),
            selectinload(InventoryAdjustment.creator)
        )
    )
    return result.scalars().first()

@router.post("/{adjustment_id}/validate", response_model=InventoryAdjustmentResponse)
async def validate_adjustment(
    adjustment_id: str,
    db: AsyncSession = Depends(deps.get_db),
    current_user = Depends(deps.get_current_user)
) -> Any:
    result = await db.execute(
        select(InventoryAdjustment)
        .where(InventoryAdjustment.id == adjustment_id)
        .options(selectinload(InventoryAdjustment.lines))
    )
    adjustment = result.scalars().first()
    
    if not adjustment:
        raise HTTPException(status_code=404, detail="Adjustment not found")
    
    if adjustment.state != AdjustmentState.DRAFT:
        raise HTTPException(status_code=400, detail="Adjustment is already validated or cancelled")

    from app.models.stock import MoveType, MoveState
    from app.services import stock_service
    
    for line in adjustment.lines:
        # Calculate difference based on current system quantity at validation time
        # Or should we trust the 'system_quantity' snapshot? 
        # Usually, adjustments are "make it X". So we check current and adjust by (X - current).
        
        quant = await stock_service.get_stock_quant(db, line.product_id, line.location_id)
        current_qty = quant.quantity if quant else 0
        
        diff = line.counted_quantity - current_qty
        
        if diff != 0:
            await stock_service.update_stock(
                db, 
                line.product_id, 
                line.location_id, 
                diff,
                allow_negative=True
            )
            
            # Create stock move
            # For adjustment, we don't have a partner location, so one side is None (or virtual)
            await stock_service.create_stock_move(
                db,
                product_id=line.product_id,
                quantity=abs(diff),
                move_type=MoveType.ADJUSTMENT,
                state=MoveState.DONE,
                user_id=current_user.id,
                from_location_id=line.location_id if diff < 0 else None,
                to_location_id=line.location_id if diff > 0 else None,
                reference_type="inventory_adjustment",
                reference_id=adjustment.id,
                notes=f"Adjustment {adjustment.adjustment_number}"
            )

    adjustment.state = AdjustmentState.DONE
    adjustment.validated_by = current_user.id
    from datetime import datetime
    adjustment.validated_at = datetime.now()
    
    await db.commit()
    
    result = await db.execute(
        select(InventoryAdjustment)
        .where(InventoryAdjustment.id == adjustment.id)
        .options(
            selectinload(InventoryAdjustment.lines).selectinload(InventoryAdjustmentLine.product).selectinload(Product.category),
            selectinload(InventoryAdjustment.lines).selectinload(InventoryAdjustmentLine.product).selectinload(Product.uom),
            selectinload(InventoryAdjustment.lines).selectinload(InventoryAdjustmentLine.location),
            selectinload(InventoryAdjustment.warehouse).selectinload(Warehouse.locations),
            selectinload(InventoryAdjustment.creator),
            selectinload(InventoryAdjustment.validator)
        )
    )
    return result.scalars().first()

