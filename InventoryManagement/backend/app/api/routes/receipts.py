from typing import List, Any
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.api import deps
from app.models.documents import Receipt, ReceiptLine, DocumentStatus
from app.models.product import Product
from app.models.warehouse import Warehouse
from app.schemas.documents import ReceiptCreate, ReceiptResponse

router = APIRouter()

@router.get("", response_model=List[ReceiptResponse])
async def read_receipts(
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(deps.get_db),
    current_user = Depends(deps.get_current_user)
) -> Any:
    result = await db.execute(
        select(Receipt)
        .options(
            selectinload(Receipt.lines).selectinload(ReceiptLine.product).selectinload(Product.category),
            selectinload(Receipt.lines).selectinload(ReceiptLine.product).selectinload(Product.uom),
            selectinload(Receipt.lines).selectinload(ReceiptLine.location),
            selectinload(Receipt.warehouse).selectinload(Warehouse.locations),
            selectinload(Receipt.supplier),
            selectinload(Receipt.creator),
            selectinload(Receipt.validator)
        )
        .offset(skip)
        .limit(limit)
    )
    return result.scalars().all()

@router.post("", response_model=ReceiptResponse)
async def create_receipt(
    receipt_in: ReceiptCreate,
    db: AsyncSession = Depends(deps.get_db),
    current_user = Depends(deps.get_current_user)
) -> Any:
    receipt = Receipt(
        receipt_number=receipt_in.receipt_number,
        supplier_id=receipt_in.supplier_id,
        warehouse_id=receipt_in.warehouse_id,
        location_id=receipt_in.location_id,
        receipt_date=receipt_in.receipt_date,
        scheduled_date=receipt_in.scheduled_date,
        reference=receipt_in.reference,
        notes=receipt_in.notes,
        created_by=current_user.id,
        state=DocumentStatus.DRAFT
    )
    db.add(receipt)
    await db.flush() # Get ID

    for line_in in receipt_in.lines:
        line = ReceiptLine(
            receipt_id=receipt.id,
            product_id=line_in.product_id,
            location_id=line_in.location_id,
            ordered_quantity=line_in.ordered_quantity,
            received_quantity=line_in.received_quantity,
            unit_price=line_in.unit_price,
            notes=line_in.notes
        )
        db.add(line)
    
    await db.commit()
    await db.refresh(receipt)
    
    # Re-fetch with relations
    result = await db.execute(
        select(Receipt)
        .where(Receipt.id == receipt.id)
        .options(
            selectinload(Receipt.lines).selectinload(ReceiptLine.product).selectinload(Product.category),
            selectinload(Receipt.lines).selectinload(ReceiptLine.product).selectinload(Product.uom),
            selectinload(Receipt.lines).selectinload(ReceiptLine.location),
            selectinload(Receipt.warehouse).selectinload(Warehouse.locations),
            selectinload(Receipt.supplier),
            selectinload(Receipt.creator)
        )
    )
    return result.scalars().first()

@router.post("/{receipt_id}/validate", response_model=ReceiptResponse)
async def validate_receipt(
    receipt_id: str,
    db: AsyncSession = Depends(deps.get_db),
    current_user = Depends(deps.get_current_user)
) -> Any:
    result = await db.execute(
        select(Receipt)
        .where(Receipt.id == receipt_id)
        .options(selectinload(Receipt.lines))
    )
    receipt = result.scalars().first()
    if not receipt:
        raise HTTPException(status_code=404, detail="Receipt not found")
    
    if receipt.state != DocumentStatus.DRAFT:
        raise HTTPException(status_code=400, detail="Receipt is already validated or cancelled")

    # Process stock moves
    from app.models.stock import MoveType, MoveState
    
    for line in receipt.lines:
        # Increase stock at destination location
        await stock_service.update_stock(
            db, 
            line.product_id, 
            line.location_id, 
            line.received_quantity
        )
        
        # Create stock move
        await stock_service.create_stock_move(
            db,
            product_id=line.product_id,
            quantity=line.received_quantity,
            move_type=MoveType.RECEIPT,
            state=MoveState.DONE,
            user_id=current_user.id,
            to_location_id=line.location_id,
            reference_type="receipt",
            reference_id=receipt.id,
            notes=f"Receipt {receipt.receipt_number}"
        )

    receipt.state = DocumentStatus.DONE
    receipt.validated_by = current_user.id
    from datetime import datetime
    receipt.validated_at = datetime.now()
    
    await db.commit()
    
    result = await db.execute(
        select(Receipt)
        .options(
            selectinload(Receipt.lines).selectinload(ReceiptLine.product).selectinload(Product.category),
            selectinload(Receipt.lines).selectinload(ReceiptLine.product).selectinload(Product.uom),
            selectinload(Receipt.lines).selectinload(ReceiptLine.location),
            selectinload(Receipt.warehouse).selectinload(Warehouse.locations),
            selectinload(Receipt.supplier),
            selectinload(Receipt.creator),
            selectinload(Receipt.validator)
        )
        .where(Receipt.id == receipt.id)
    )
    return result.scalars().first()


