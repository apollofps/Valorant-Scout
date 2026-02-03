@echo off
setlocal
cd /d "%~dp0"
cd backend
if not exist "venv\Scripts\python.exe" (
    echo ERROR: venv not found in backend folder.
    echo Run these in the backend folder:
    echo   python -m venv venv
    echo   venv\Scripts\pip install -r requirements.txt
    pause
    exit /b 1
)
echo Opening backend window at http://localhost:8000
start "VALORANT Scout Backend" cmd /k "cd /d %~dp0backend && venv\Scripts\python.exe -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000"
echo Backend started in new window. Close that window to stop the server.
timeout /t 2 /nobreak >nul
endlocal
