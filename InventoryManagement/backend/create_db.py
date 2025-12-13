import asyncio
import asyncpg
import os
from dotenv import load_dotenv

# Load env vars manually since we might run this before app is fully ready
load_dotenv()

POSTGRES_USER = os.getenv("POSTGRES_USER", "postgres")
POSTGRES_PASSWORD = os.getenv("POSTGRES_PASSWORD", "postgres")
POSTGRES_SERVER = os.getenv("POSTGRES_SERVER", "localhost")
POSTGRES_PORT = os.getenv("POSTGRES_PORT", "5432")
POSTGRES_DB = os.getenv("POSTGRES_DB", "stockmaster")

async def create_database():
    print(f"Connecting to PostgreSQL at {POSTGRES_SERVER}:{POSTGRES_PORT} as {POSTGRES_USER}...")
    try:
        # Connect to default 'postgres' database
        sys_conn = await asyncpg.connect(
            user=POSTGRES_USER,
            password=POSTGRES_PASSWORD,
            host=POSTGRES_SERVER,
            port=POSTGRES_PORT,
            database='postgres'
        )
    except Exception as e:
        print(f"Error connecting to PostgreSQL: {e}")
        print("Please check if your PostgreSQL server is running and credentials in .env are correct.")
        return False

    try:
        # Check if db exists
        exists = await sys_conn.fetchval("SELECT 1 FROM pg_database WHERE datname = $1", POSTGRES_DB)
        if not exists:
            print(f"Creating database '{POSTGRES_DB}'...")
            await sys_conn.execute(f'CREATE DATABASE "{POSTGRES_DB}"')
            print("Database created successfully.")
        else:
            print(f"Database '{POSTGRES_DB}' already exists.")
        return True
    except Exception as e:
        print(f"Error creating database: {e}")
        return False
    finally:
        await sys_conn.close()

if __name__ == "__main__":
    success = asyncio.run(create_database())
    if not success:
        exit(1)
