import asyncio
from app.db.session import engine, Base

# Ensure models are imported so they register with Base.metadata
import app.models  # noqa: F401


async def create_all():
    print('Creating tables using SQLAlchemy metadata...')
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    print('Tables created.')

if __name__ == '__main__':
    asyncio.run(create_all())
