import asyncio
import sys
import os

# Add the backend directory to sys.path
sys.path.append(os.path.join(os.path.dirname(__file__)))

from app.db.session import AsyncSessionLocal
from app.models.user import User
from sqlalchemy import select

async def list_users():
    async with AsyncSessionLocal() as db:
        result = await db.execute(select(User))
        users = result.scalars().all()
        print("--- USERS IN DATABASE ---")
        for user in users:
            print(f"ID: {user.id}, Email: {user.email}, Active: {user.is_active}")
        print("-------------------------")

if __name__ == "__main__":
    # Windows specific event loop policy
    if sys.platform == 'win32':
        asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
    asyncio.run(list_users())
