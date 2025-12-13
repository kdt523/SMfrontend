# StockMaster Backend

This is the FastAPI backend for the StockMaster Inventory Management System.

## Setup

### Prerequisites
- Python 3.9+
- Docker (for PostgreSQL)

### Installation

1. Navigate to `backend/`:
   ```bash
   cd backend
   ```

2. Create a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

### Database

1. Start PostgreSQL using Docker Compose (from the root `inventorymanagement` folder):
   ```bash
   docker-compose up -d
   ```

2. Run migrations:
   ```bash
   cd backend
   alembic revision --autogenerate -m "Initial migration"
   alembic upgrade head
   ```

### Running the API

```bash
cd backend
uvicorn app.main:app --reload
```

The API will be available at `http://localhost:8000`.
Interactive docs: `http://localhost:8000/docs`.

## Project Structure

- `app/main.py`: Entry point.
- `app/api/`: API routers.
- `app/models/`: SQLAlchemy models.
- `app/schemas/`: Pydantic schemas.
- `app/services/`: Business logic (Auth, Stock).
- `app/core/`: Config and Security.
