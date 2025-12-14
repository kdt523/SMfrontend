from decimal import Decimal
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from uuid import UUID
from app.models.stock import StockQuant, StockMove, MoveType, MoveState
from app.models.product import Product
from app.models.alerts import StockAlert, AlertType, AlertLevel
from fastapi import HTTPException

async def get_stock_quant(db: AsyncSession, product_id: UUID, location_id: UUID) -> StockQuant:
    result = await db.execute(
        select(StockQuant).where(
            StockQuant.product_id == product_id,
            StockQuant.location_id == location_id
        )
    )
    return result.scalars().first()

async def update_stock(
    db: AsyncSession,
    product_id: UUID,
    location_id: UUID,
    quantity_change: Decimal,
    allow_negative: bool = False
):
    quant = await get_stock_quant(db, product_id, location_id)
    
    if not quant:
        if not allow_negative and quantity_change < 0:
             raise HTTPException(status_code=400, detail=f"Insufficient stock for product {product_id} at location {location_id}")
        
        quant = StockQuant(product_id=product_id, location_id=location_id, quantity=quantity_change)
        db.add(quant)
    else:
        new_qty = quant.quantity + quantity_change
        if not allow_negative and new_qty < 0:
            raise HTTPException(status_code=400, detail=f"Insufficient stock for product {product_id} at location {location_id}. Current: {quant.quantity}, Requested change: {quantity_change}")
        quant.quantity = new_qty
        db.add(quant) # Mark as modified
    
    await db.flush()

    # Check for alerts
    product_result = await db.execute(select(Product).where(Product.id == product_id))
    product = product_result.scalars().first()
    
    if product and product.min_stock_level is not None:
        quants_result = await db.execute(select(StockQuant).where(StockQuant.product_id == product_id))
        all_quants = quants_result.scalars().all()
        total_qty = sum(q.quantity for q in all_quants)
        
        if total_qty <= product.min_stock_level:
             existing_alert = await db.execute(
                select(StockAlert).where(
                    StockAlert.product_id == product_id,
                    StockAlert.is_resolved == False,
                    StockAlert.alert_type == AlertType.LOW_STOCK
                )
            )
             if not existing_alert.scalars().first():
                alert = StockAlert(
                    product_id=product_id,
                    alert_type=AlertType.LOW_STOCK,
                    current_quantity=total_qty,
                    threshold_quantity=product.min_stock_level,
                    alert_level=AlertLevel.WARNING
                )
                db.add(alert)
        else:
             existing_alerts = await db.execute(
                select(StockAlert).where(
                    StockAlert.product_id == product_id,
                    StockAlert.is_resolved == False,
                    StockAlert.alert_type == AlertType.LOW_STOCK
                )
            )
             for alert in existing_alerts.scalars().all():
                 alert.is_resolved = True

    return quant

async def create_stock_move(
    db: AsyncSession,
    product_id: UUID,
    quantity: Decimal,
    move_type: MoveType,
    state: MoveState,
    user_id: UUID,
    from_location_id: UUID = None,
    to_location_id: UUID = None,
    reference_type: str = None,
    reference_id: UUID = None,
    notes: str = None
):
    move = StockMove(
        product_id=product_id,
        quantity=quantity,
        move_type=move_type,
        state=state,
        user_id=user_id,
        from_location_id=from_location_id,
        to_location_id=to_location_id,
        reference_type=reference_type,
        reference_id=reference_id,
        notes=notes
    )
    db.add(move)
    return move

