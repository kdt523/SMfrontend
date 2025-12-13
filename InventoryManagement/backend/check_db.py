import asyncio
import os
from dotenv import load_dotenv
import asyncpg

load_dotenv()

POSTGRES_USER = os.getenv("POSTGRES_USER", "postgres")
POSTGRES_PASSWORD = os.getenv("POSTGRES_PASSWORD", "postgres")
POSTGRES_SERVER = os.getenv("POSTGRES_SERVER", "localhost")
POSTGRES_PORT = os.getenv("POSTGRES_PORT", "5432")
POSTGRES_DB = os.getenv("POSTGRES_DB", "stockmaster")

async def main():
    print(f"Connecting to {POSTGRES_SERVER}:{POSTGRES_PORT}/{POSTGRES_DB} as {POSTGRES_USER}")
    try:
        conn = await asyncpg.connect(
            user=POSTGRES_USER,
            password=POSTGRES_PASSWORD,
            host=POSTGRES_SERVER,
            port=POSTGRES_PORT,
            database=POSTGRES_DB,
        )
    except Exception as e:
        print("ERROR: Could not connect to database:", e)
        return 1

    try:
        tables = await conn.fetch(
            "SELECT tablename FROM pg_catalog.pg_tables WHERE schemaname NOT IN ('pg_catalog','information_schema');"
        )
        table_names = [r['tablename'] for r in tables]
        print("Tables found:", table_names)

        if 'users' in table_names:
            user_count = await conn.fetchval('SELECT count(*) FROM users')
            print('Users table row count:', user_count)
        else:
            print('Users table not found. Migrations may not have run.')

        version = await conn.fetchval("SELECT version_num FROM alembic_version")
        print('Alembic version:', version)
    except Exception as e:
        print('ERROR querying database:', e)
    finally:
        await conn.close()
    return 0

if __name__ == '__main__':
    code = asyncio.run(main())
    raise SystemExit(code)
