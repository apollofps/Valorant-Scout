# 📦 Installation Requirements

## Current Status
❌ Python - Not installed  
❌ Node.js - Not installed  
❌ Docker - Not installed  

## Quick Installation Guide

### 1. Install Python 3.11+ (Required for Backend)

**Option A: Official Installer (Recommended)**
1. Visit: https://www.python.org/downloads/
2. Download Python 3.11 or 3.12
3. **CRITICAL**: During installation, check ✅ **"Add Python to PATH"**
4. Click "Install Now"
5. Restart PowerShell after installation

**Option B: Microsoft Store**
1. Open Microsoft Store
2. Search "Python 3.11"
3. Click Install
4. Restart PowerShell

**Verify Installation:**
```powershell
python --version
# Should show: Python 3.11.x or Python 3.12.x
```

---

### 2. Install Node.js 20+ (Required for Frontend)

1. Visit: https://nodejs.org/
2. Download **LTS version** (20.x or higher)
3. Run installer (default options are fine)
4. Restart PowerShell after installation

**Verify Installation:**
```powershell
node --version
npm --version
# Should show: v20.x.x and 10.x.x
```

---

### 3. After Installation - Setup Project

Once both are installed, open a **new PowerShell window** and run:

```powershell
# Navigate to project
cd C:\Users\aswin\hack\c9sky\valorant-scout

# Backend setup
cd backend
python -m venv venv
.\venv\Scripts\activate
pip install -r requirements.txt

# Frontend setup (new terminal)
cd ..\frontend
npm install
```

---

## Alternative: Docker (All-in-One)

If you prefer not to install Python/Node separately:

1. **Install Docker Desktop:**
   - Download: https://www.docker.com/products/docker-desktop/
   - Install and start Docker Desktop
   - Wait for Docker to fully start (whale icon in system tray)

2. **Run with Docker:**
   ```powershell
   cd C:\Users\aswin\hack\c9sky\valorant-scout
   docker-compose up --build
   ```

This runs everything in containers - no local Python/Node needed!

---

## Installation Checklist

- [ ] Python 3.11+ installed
- [ ] Python added to PATH (verify with `python --version`)
- [ ] Node.js 20+ installed
- [ ] Node.js verified (verify with `node --version`)
- [ ] Backend dependencies installed (`pip install -r requirements.txt`)
- [ ] Frontend dependencies installed (`npm install`)
- [ ] `.env` file created with API keys (optional for testing)

---

## Troubleshooting

### Python not found after installation
1. Restart PowerShell completely
2. Check PATH: `$env:PATH` (should contain Python)
3. Try: `py --version` (Python launcher)
4. Reinstall Python with "Add to PATH" checked

### pip not found
- Use: `python -m pip install -r requirements.txt`
- Or: `py -m pip install -r requirements.txt`

### Execution Policy Error
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### Still having issues?
- Make sure you restarted PowerShell after installation
- Check if antivirus is blocking Python/Node
- Try installing from official websites (not Microsoft Store)

---

## Quick Test Commands

After installation, test everything:

```powershell
# Test Python
python --version
python -m pip --version

# Test Node
node --version
npm --version

# If all work, proceed with project setup
```

---

## Next Steps

Once Python and Node.js are installed:

1. ✅ Follow `QUICK_START.md` for project setup
2. ✅ Create `.env` file (see `env.example`)
3. ✅ Start backend: `uvicorn app.main:app --reload`
4. ✅ Start frontend: `npm run dev`
5. ✅ Open http://localhost:5173

Good luck! 🚀
