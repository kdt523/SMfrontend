from typing import Any, Dict
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, case

from app.api import deps
from app.models.product import Product
from app.models.documents import Receipt, DeliveryOrder, InternalTransfer, DocumentStatus

router = APIRouter()

@router.get("/summary")
async def get_dashboard_summary(
    db: AsyncSession = Depends(deps.get_db),
    current_user = Depends(deps.get_current_user)
) -> Dict[str, int]:
    # Total products
    total_products_query = select(func.count(Product.id)).where(Product.is_active == True)
    total_products = await db.scalar(total_products_query)
    
    # Pending Receipts
    pending_receipts_query = select(func.count(Receipt.id)).where(Receipt.state != DocumentStatus.DONE, Receipt.state != DocumentStatus.CANCELLED)
    pending_receipts = await db.scalar(pending_receipts_query)
    
    # Pending Deliveries
    pending_deliveries_query = select(func.count(DeliveryOrder.id)).where(DeliveryOrder.state != DocumentStatus.DONE, DeliveryOrder.state != DocumentStatus.CANCELLED)
    pending_deliveries = await db.scalar(pending_deliveries_query)
    
    # Pending Transfers
    pending_transfers_query = select(func.count(InternalTransfer.id)).where(InternalTransfer.state != DocumentStatus.DONE, InternalTransfer.state != DocumentStatus.CANCELLED)
    pending_transfers = await db.scalar(pending_transfers_query)
    
    # Low stock / Out of stock (Simplified: requires aggregation of quants, doing naive check here or complex query)
    # For high performance, this should be a pre-calculated view or optimized query.
    # Here we will just return placeholders or implement a basic check if needed.
    # Implementing a proper low stock check requires summing quants per product and comparing to reorder_level.
    
    return {
        "totalProductsInStock": total_products or 0,
        "pendingReceiptsCount": pending_receipts or 0,
        "pendingDeliveriesCount": pending_deliveries or 0,
        "pendingTransfersCount": pending_transfers or 0,
        "lowStockCount": 0, # Placeholder
        "outOfStockCount": 0 # Placeholder
    }
