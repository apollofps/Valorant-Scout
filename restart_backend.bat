@echo off
echo ========================================
echo  Valorant Scout - Backend Restart
echo ========================================
echo.
echo This will:
echo 1. Stop all Python processes
echo 2. Start the backend with updated code
echo.
pause

echo.
echo [1/3] Stopping all Python processes...
taskkill /F /IM python.exe /T 2>nul
if %errorlevel% equ 0 (
    echo SUCCESS: Python processes stopped
) else (
    echo NOTE: No Python processes were running
)

echo.
echo [2/3] Waiting for processes to fully stop...
timeout /t 3 /nobreak >nul

echo.
echo [3/3] Starting backend with new code...
cd /d C:\Users\aswin\hack\c9sky\valorant-scout\backend

echo.
echo ========================================
echo  Backend is starting...
echo  URL: http://localhost:8000
echo  Press Ctrl+C to stop the backend
echo ========================================
echo.

python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

pause
