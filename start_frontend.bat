@echo off
cd /d "%~dp0frontend"
echo Starting frontend at http://localhost:5173
echo Press Ctrl+C to stop.
echo.
if not exist "node_modules\vite" (
    echo Installing dependencies first...
    call npm install
)
call npm run dev
pause
