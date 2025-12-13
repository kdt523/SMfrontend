@echo off
echo ==========================================
echo StockMaster Database Setup Script (Local DB)
echo ==========================================

cd /d "%~dp0"

echo.
echo [1/3] Setting up Python Environment...
cd backend
if not exist "venv" (
    echo Creating virtual environment...
    python -m venv venv
)

call venv\Scripts\activate
echo Installing dependencies...
pip install -r requirements.txt >nul 2>&1
if %errorlevel% neq 0 (
    echo Error: Failed to install Python dependencies.
    pause
    exit /b 1
)

echo.
echo [2/3] Creating Database...
echo Please ensure your local PostgreSQL service is running.
echo Running Python script to create database...
python create_db.py
if %errorlevel% neq 0 (
    echo Error: Failed to create database.
    echo Please check the error message above.
    pause
    exit /b 1
)

echo.
echo [3/3] Creating Tables (Migrations)...
echo Generating migration script...
alembic revision --autogenerate -m "Initial_Setup" >nul 2>&1

echo Applying migrations...
alembic upgrade head

if %errorlevel% equ 0 (
    echo.
    echo ==========================================
    echo SUCCESS! Database is ready.
    echo ==========================================
    echo.
    echo You can now start the backend with:
    echo cd backend ^& uvicorn app.main:app --reload
) else (
    echo.
    echo Error: Failed to apply migrations.
    echo Check your .env file in the backend folder to ensure DB credentials are correct.
)

pause
