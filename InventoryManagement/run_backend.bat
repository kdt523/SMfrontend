@echo off
echo ==========================================
echo Starting StockMaster Backend Server
echo ==========================================

cd /d "%~dp0\backend"

if not exist "venv" (
    echo Error: Virtual environment not found. Please run setup_db.bat first.
    pause
    exit /b 1
)

call venv\Scripts\activate

echo Starting Uvicorn server...
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

pause
