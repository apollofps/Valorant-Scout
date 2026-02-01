# 🪟 Windows Setup Guide

## Python Installation Required

Python is not currently installed on your system. Here are your options:

## Option 1: Install Python (Recommended)

### Step 1: Download Python
1. Go to https://www.python.org/downloads/
2. Download Python 3.11 or 3.12 (latest stable)
3. **IMPORTANT**: During installation, check ✅ **"Add Python to PATH"**

### Step 2: Verify Installation
Open a **new** PowerShell window and run:
```powershell
python --version
pip --version
```

### Step 3: Install Backend Dependencies
```powershell
cd valorant-scout\backend
python -m venv venv
.\venv\Scripts\activate
pip install -r requirements.txt
```

### Step 4: Start Backend
```powershell
uvicorn app.main:app --reload
```

---

## Option 2: Use Docker (No Python Installation Needed)

If you have Docker Desktop installed, you can run everything in containers:

### Step 1: Install Docker Desktop
- Download from: https://www.docker.com/products/docker-desktop/
- Install and start Docker Desktop

### Step 2: Run with Docker Compose
```powershell
cd valorant-scout
docker-compose up --build
```

This will start:
- Backend on http://localhost:8000
- Frontend on http://localhost:3000
- Redis on port 6379

**Note**: You'll still need to create a `.env` file with your API keys.

---

## Option 3: Use Windows Store Python (Quick but Limited)

1. Open Microsoft Store
2. Search for "Python 3.11" or "Python 3.12"
3. Click Install
4. After installation, open a new PowerShell window
5. Follow Step 3 from Option 1

---

## Quick Test (After Python Installation)

```powershell
# Test Python
python --version

# Test pip
pip --version

# If both work, proceed with backend setup
cd valorant-scout\backend
python -m venv venv
.\venv\Scripts\activate
pip install -r requirements.txt
```

---

## Troubleshooting

### "python is not recognized"
- **Solution**: Restart PowerShell after installing Python
- Make sure "Add Python to PATH" was checked during installation
- Try using `py` launcher: `py -m pip install -r requirements.txt`

### "pip is not recognized"
- **Solution**: Python might be installed but pip isn't in PATH
- Try: `python -m pip install -r requirements.txt`
- Or: `py -m pip install -r requirements.txt`

### "Execution Policy Error"
If you get execution policy errors:
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

---

## Frontend Setup (Node.js Required)

You'll also need Node.js for the frontend:

1. Download Node.js from: https://nodejs.org/
2. Install the LTS version (20.x or higher)
3. Verify: `node --version` and `npm --version`
4. Then:
```powershell
cd valorant-scout\frontend
npm install
npm run dev
```

---

## Recommended Setup Order

1. ✅ Install Python 3.11+ (with PATH option)
2. ✅ Install Node.js 20+ (LTS)
3. ✅ Set up backend (Python)
4. ✅ Set up frontend (Node.js)
5. ✅ Configure `.env` file with API keys
6. ✅ Start both servers
7. ✅ Test the application

---

## Need Help?

- Python issues: Check https://www.python.org/downloads/
- Node.js issues: Check https://nodejs.org/
- Docker alternative: Use Option 2 above
