# Start local servers

**Backend (port 8000)** and **Frontend (port 5173)** must both be running.

## Option 1: Double‑click (Windows)

1. **Backend:** double‑click **`restart_backend.bat`**  
   - Opens a window; backend runs at http://localhost:8000  
   - Leave this window open.

2. **Frontend:** double‑click **`start_frontend.bat`**  
   - Opens a window; frontend runs at http://localhost:5173  
   - Leave this window open.

3. Open **http://localhost:5173** in your browser.

## Option 2: Terminal (from repo root)

**Terminal 1 – backend:**
```bash
cd backend
venv\Scripts\python.exe -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

**Terminal 2 – frontend:**
```bash
cd frontend
npm install
npm run dev
```

Then open http://localhost:5173.

## If something fails

- **Backend:** “venv not found” → in `backend` run:  
  `python -m venv venv` then `venv\Scripts\pip install -r requirements.txt`
- **Frontend:** “Cannot find module vite” → in `frontend` run:  
  `npm install`
- **Port in use:** close any other app using 8000 or 5173, or stop existing backend/frontend windows.
