# Python Version Guide

## Current Situation
- You have Python 3.14.2 installed
- Some packages don't have pre-built wheels for Python 3.14 yet
- This can cause compilation issues (like we saw with pydantic-core)

## Recommended Solution: Install Python 3.12

Python 3.12 is the current stable LTS version with excellent package support.

### Step 1: Download Python 3.12
1. Go to: https://www.python.org/downloads/release/python-31211/
2. Download "Windows installer (64-bit)"
3. **IMPORTANT**: Check ✅ "Add Python to PATH"
4. During installation, choose "Install for all users" (optional)
5. Click "Install Now"

### Step 2: Create New Virtual Environment with Python 3.12

After installing Python 3.12, you can use it specifically:

```powershell
# Check if Python 3.12 is available
py -3.12 --version

# Navigate to backend
cd C:\Users\aswin\hack\c9sky\valorant-scout\backend

# Remove old venv (optional)
Remove-Item -Recurse -Force venv

# Create new venv with Python 3.12
py -3.12 -m venv venv

# Activate it
.\venv\Scripts\activate

# Verify Python version
python --version  # Should show 3.12.x

# Install requirements
pip install -r requirements.txt
```

### Step 3: Using Python Launcher

Windows Python launcher (`py`) lets you choose versions:

```powershell
py -3.12    # Use Python 3.12
py -3.14    # Use Python 3.14
py --list   # See all installed versions
```

## Alternative: Continue with Python 3.14

If you want to stick with 3.14, we can:
1. Update requirements.txt to use newer package versions
2. Install packages that have Python 3.14 wheels
3. Skip packages that don't work (like old pandas/numpy versions)

But this is more work and less reliable.

## My Recommendation

**Install Python 3.12** - it's the safest choice for hackathon projects:
- ✅ All packages have pre-built wheels
- ✅ No compilation needed
- ✅ Faster installation
- ✅ More stable and tested

You can keep both Python 3.12 and 3.14 installed - they won't conflict!

## Quick Commands After Installing Python 3.12

```powershell
# Verify installation
py -3.12 --version

# Create venv with 3.12
cd C:\Users\aswin\hack\c9sky\valorant-scout\backend
py -3.12 -m venv venv
.\venv\Scripts\activate
pip install -r requirements.txt
```
