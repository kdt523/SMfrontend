from typing import List, Any
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.api import deps
from app.models.documents import DeliveryOrder, DeliveryOrderLine, DocumentStatus
from app.models.partners import Customer
from app.models.product import Product
from app.models.warehouse import Warehouse
from app.schemas.documents import DeliveryOrderCreate, DeliveryOrderResponse

router = APIRouter()

@router.get("", response_model=List[DeliveryOrderResponse])
async def read_deliveries(
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(deps.get_db),
    current_user = Depends(deps.get_current_user)
) -> Any:
    result = await db.execute(
        select(DeliveryOrder)
        .options(
            selectinload(DeliveryOrder.lines).selectinload(DeliveryOrderLine.product).selectinload(Product.category),
            selectinload(DeliveryOrder.lines).selectinload(DeliveryOrderLine.product).selectinload(Product.uom),
            selectinload(DeliveryOrder.lines).selectinload(DeliveryOrderLine.location),
            selectinload(DeliveryOrder.warehouse).selectinload(Warehouse.locations),
            selectinload(DeliveryOrder.customer),
            selectinload(DeliveryOrder.creator),
            selectinload(DeliveryOrder.validator)
        )
        .offset(skip)
        .limit(limit)
    )
    return result.scalars().all()

from sqlalchemy.exc import IntegrityError

@router.post("", response_model=DeliveryOrderResponse)
async def create_delivery(
    delivery_in: DeliveryOrderCreate,
    db: AsyncSession = Depends(deps.get_db),
    current_user = Depends(deps.get_current_user)
) -> Any:
    try:
        delivery = DeliveryOrder(
            delivery_number=delivery_in.delivery_number,
            customer_id=delivery_in.customer_id,
            warehouse_id=delivery_in.warehouse_id,
            delivery_date=delivery_in.delivery_date,
            scheduled_date=delivery_in.scheduled_date,
            reference=delivery_in.reference,
            delivery_address=delivery_in.delivery_address,
            notes=delivery_in.notes,
            created_by=current_user.id,
            state=DocumentStatus.DRAFT
        )
        db.add(delivery)
        await db.flush()

        for line_in in delivery_in.lines:
            line = DeliveryOrderLine(
                delivery_order_id=delivery.id,
                product_id=line_in.product_id,
                location_id=line_in.location_id,
                ordered_quantity=line_in.ordered_quantity,
                picked_quantity=line_in.picked_quantity,
                delivered_quantity=line_in.delivered_quantity,
                unit_price=line_in.unit_price,
                notes=line_in.notes
            )
            db.add(line)
        
        await db.commit()
        await db.refresh(delivery)
        
        result = await db.execute(
            select(DeliveryOrder)
            .where(DeliveryOrder.id == delivery.id)
            .options(
                selectinload(DeliveryOrder.lines).selectinload(DeliveryOrderLine.product).selectinload(Product.category),
                selectinload(DeliveryOrder.lines).selectinload(DeliveryOrderLine.product).selectinload(Product.uom),
                selectinload(DeliveryOrder.lines).selectinload(DeliveryOrderLine.location),
                selectinload(DeliveryOrder.warehouse).selectinload(Warehouse.locations),
                selectinload(DeliveryOrder.customer),
                selectinload(DeliveryOrder.creator),
                selectinload(DeliveryOrder.validator)
            )
        )
        return result.scalars().first()
    except IntegrityError as e:
        await db.rollback()
        if "ix_delivery_orders_delivery_number" in str(e):
            raise HTTPException(status_code=400, detail="Delivery number already exists. Please use a unique number.")
        raise HTTPException(status_code=400, detail=f"Database integrity error: {str(e)}")
    except Exception as e:
        await db.rollback()
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error creating delivery: {str(e)}")

@router.post("/{delivery_id}/validate", response_model=DeliveryOrderResponse)
async def validate_delivery(
    delivery_id: str,
    db: AsyncSession = Depends(deps.get_db),
    current_user = Depends(deps.get_current_user)
) -> Any:
    result = await db.execute(
        select(DeliveryOrder)
        .where(DeliveryOrder.id == delivery_id)
        .options(selectinload(DeliveryOrder.lines))
    )
    delivery = result.scalars().first()
    if not delivery:
        raise HTTPException(status_code=404, detail="Delivery not found")
    
    if delivery.state != DocumentStatus.DRAFT:
        raise HTTPException(status_code=400, detail="Delivery is already validated or cancelled")

    from app.models.stock import MoveType, MoveState
    from app.services import stock_service
    
    for line in delivery.lines:
        # Decrease stock at source location
        # delivered_quantity is what we are moving out
        qty = line.delivered_quantity if line.delivered_quantity > 0 else line.ordered_quantity
        
        await stock_service.update_stock(
            db, 
            line.product_id, 
            line.location_id, 
            -qty, # Negative for delivery
            allow_negative=False # Prevent negative stock
        )
        
        # Create stock move
        await stock_service.create_stock_move(
            db,
            product_id=line.product_id,
            quantity=qty,
            move_type=MoveType.DELIVERY,
            state=MoveState.DONE,
            user_id=current_user.id,
            from_location_id=line.location_id,
            reference_type="delivery_order",
            reference_id=delivery.id,
            notes=f"Delivery {delivery.delivery_number}"
        )
        
        # Update line delivered qty if it was 0
        if line.delivered_quantity == 0:
            line.delivered_quantity = qty
            db.add(line)

    delivery.state = DocumentStatus.DONE
    delivery.validated_by = current_user.id
    from datetime import datetime
    delivery.validated_at = datetime.now()
    
    await db.commit()
    await db.refresh(delivery)
    return delivery
