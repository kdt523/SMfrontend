from typing import List, Any
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.api import deps
from app.models.documents import InternalTransfer, InternalTransferLine, DocumentStatus
from app.models.product import Product
from app.models.warehouse import Warehouse
from app.schemas.documents import InternalTransferCreate, InternalTransferResponse

router = APIRouter()

@router.get("", response_model=List[InternalTransferResponse])
async def read_transfers(
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(deps.get_db),
    current_user = Depends(deps.get_current_user)
) -> Any:
    result = await db.execute(
        select(InternalTransfer)
        .options(
            selectinload(InternalTransfer.lines).selectinload(InternalTransferLine.product).selectinload(Product.category),
            selectinload(InternalTransfer.lines).selectinload(InternalTransferLine.product).selectinload(Product.uom),
            selectinload(InternalTransfer.lines).selectinload(InternalTransferLine.from_location),
            selectinload(InternalTransfer.lines).selectinload(InternalTransferLine.to_location),
            selectinload(InternalTransfer.from_warehouse).selectinload(Warehouse.locations),
            selectinload(InternalTransfer.to_warehouse).selectinload(Warehouse.locations),
            selectinload(InternalTransfer.creator),
            selectinload(InternalTransfer.validator)
        )
        .offset(skip)
        .limit(limit)
    )
    return result.scalars().all()

@router.post("", response_model=InternalTransferResponse)
async def create_transfer(
    transfer_in: InternalTransferCreate,
    db: AsyncSession = Depends(deps.get_db),
    current_user = Depends(deps.get_current_user)
) -> Any:
    transfer = InternalTransfer(
        transfer_number=transfer_in.transfer_number,
        from_warehouse_id=transfer_in.from_warehouse_id,
        to_warehouse_id=transfer_in.to_warehouse_id,
        from_location_id=transfer_in.from_location_id,
        to_location_id=transfer_in.to_location_id,
        transfer_date=transfer_in.transfer_date,
        scheduled_date=transfer_in.scheduled_date,
        transfer_type=transfer_in.transfer_type,
        reference=transfer_in.reference,
        notes=transfer_in.notes,
        created_by=current_user.id,
        state=DocumentStatus.DRAFT
    )
    db.add(transfer)
    await db.flush()

    for line_in in transfer_in.lines:
        line = InternalTransferLine(
            transfer_id=transfer.id,
            product_id=line_in.product_id,
            from_location_id=line_in.from_location_id,
            to_location_id=line_in.to_location_id,
            quantity=line_in.quantity,
            transferred_quantity=line_in.transferred_quantity,
            notes=line_in.notes
        )
        db.add(line)
    
    await db.commit()
    await db.refresh(transfer)
    
    result = await db.execute(
        select(InternalTransfer)
        .where(InternalTransfer.id == transfer.id)
        .options(
            selectinload(InternalTransfer.lines).selectinload(InternalTransferLine.product).selectinload(Product.category),
            selectinload(InternalTransfer.lines).selectinload(InternalTransferLine.product).selectinload(Product.uom),
            selectinload(InternalTransfer.lines).selectinload(InternalTransferLine.from_location),
            selectinload(InternalTransfer.lines).selectinload(InternalTransferLine.to_location),
            selectinload(InternalTransfer.from_warehouse).selectinload(Warehouse.locations),
            selectinload(InternalTransfer.to_warehouse).selectinload(Warehouse.locations),
            selectinload(InternalTransfer.creator)
        )
    )
    return result.scalars().first()

@router.post("/{transfer_id}/validate", response_model=InternalTransferResponse)
async def validate_transfer(
    transfer_id: str,
    db: AsyncSession = Depends(deps.get_db),
    current_user = Depends(deps.get_current_user)
) -> Any:
    result = await db.execute(
        select(InternalTransfer)
        .where(InternalTransfer.id == transfer_id)
        .options(selectinload(InternalTransfer.lines))
    )
    transfer = result.scalars().first()
    if not transfer:
        raise HTTPException(status_code=404, detail="Transfer not found")
    
    if transfer.state != DocumentStatus.DRAFT:
        raise HTTPException(status_code=400, detail="Transfer is already validated or cancelled")

    from app.models.stock import MoveType, MoveState
    from app.services import stock_service
    
    for line in transfer.lines:
        qty = line.transferred_quantity if line.transferred_quantity > 0 else line.quantity
        
        # Decrease from source
        await stock_service.update_stock(
            db, 
            line.product_id, 
            line.from_location_id, 
            -qty,
            allow_negative=False
        )
        
        # Increase at dest
        await stock_service.update_stock(
            db, 
            line.product_id, 
            line.to_location_id, 
            qty
        )
        
        # Create stock move
        await stock_service.create_stock_move(
            db,
            product_id=line.product_id,
            quantity=qty,
            move_type=MoveType.INTERNAL,
            state=MoveState.DONE,
            user_id=current_user.id,
            from_location_id=line.from_location_id,
            to_location_id=line.to_location_id,
            reference_type="internal_transfer",
            reference_id=transfer.id,
            notes=f"Transfer {transfer.transfer_number}"
        )
        
        if line.transferred_quantity == 0:
            line.transferred_quantity = qty
            db.add(line)

    transfer.state = DocumentStatus.DONE
    transfer.validated_by = current_user.id
    from datetime import datetime
    transfer.validated_at = datetime.now()
    
    await db.commit()
    
    result = await db.execute(
        select(InternalTransfer)
        .where(InternalTransfer.id == transfer.id)
        .options(
            selectinload(InternalTransfer.lines).selectinload(InternalTransferLine.product).selectinload(Product.category),
            selectinload(InternalTransfer.lines).selectinload(InternalTransferLine.product).selectinload(Product.uom),
            selectinload(InternalTransfer.lines).selectinload(InternalTransferLine.from_location),
            selectinload(InternalTransfer.lines).selectinload(InternalTransferLine.to_location),
            selectinload(InternalTransfer.from_warehouse).selectinload(Warehouse.locations),
            selectinload(InternalTransfer.to_warehouse).selectinload(Warehouse.locations),
            selectinload(InternalTransfer.creator),
            selectinload(InternalTransfer.validator)
        )
    )
    return result.scalars().first()
