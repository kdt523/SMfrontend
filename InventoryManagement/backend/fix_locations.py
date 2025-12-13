import asyncio
from sqlalchemy import select
from app.db.session import AsyncSessionLocal
from app.models.warehouse import Warehouse, Location, LocationType

async def fix_missing_locations():
    async with AsyncSessionLocal() as db:
        # Get all warehouses
        result = await db.execute(select(Warehouse))
        warehouses = result.scalars().all()
        
        for wh in warehouses:
            # Check if warehouse has locations
            result = await db.execute(select(Location).where(Location.warehouse_id == wh.id))
            locations = result.scalars().all()
            
            if not locations:
                print(f"Creating default location for warehouse: {wh.name}")
                loc = Location(
                    warehouse_id=wh.id,
                    name="Stock",
                    code="STOCK",
                    location_type=LocationType.SHELF,
                    is_active=True
                )
                db.add(loc)
                await db.commit()
            else:
                print(f"Warehouse {wh.name} already has {len(locations)} locations.")

if __name__ == "__main__":
    asyncio.run(fix_missing_locations())
