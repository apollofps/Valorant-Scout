# VALORANT Scout - Installation Checker
# Run this script to check what's installed

Write-Host "🔍 Checking installation requirements..." -ForegroundColor Cyan
Write-Host ""

# Check Python
Write-Host "Python:" -ForegroundColor Yellow
try {
    $pythonVersion = python --version 2>&1
    Write-Host "  ✅ $pythonVersion" -ForegroundColor Green
    
    # Check pip
    try {
        $pipVersion = pip --version 2>&1
        Write-Host "  ✅ pip installed" -ForegroundColor Green
    } catch {
        Write-Host "  ⚠️  pip not found (try: python -m pip)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "  ❌ Python not installed" -ForegroundColor Red
    Write-Host "     Download from: https://www.python.org/downloads/" -ForegroundColor Gray
    Write-Host "     Make sure to check 'Add Python to PATH' during installation" -ForegroundColor Gray
}

Write-Host ""

# Check Node.js
Write-Host "Node.js:" -ForegroundColor Yellow
try {
    $nodeVersion = node --version 2>&1
    Write-Host "  ✅ $nodeVersion" -ForegroundColor Green
    
    # Check npm
    try {
        $npmVersion = npm --version 2>&1
        Write-Host "  ✅ npm $npmVersion" -ForegroundColor Green
    } catch {
        Write-Host "  ⚠️  npm not found" -ForegroundColor Yellow
    }
} catch {
    Write-Host "  ❌ Node.js not installed" -ForegroundColor Red
    Write-Host "     Download from: https://nodejs.org/ (LTS version)" -ForegroundColor Gray
}

Write-Host ""

# Check Docker
Write-Host "Docker:" -ForegroundColor Yellow
try {
    $dockerVersion = docker --version 2>&1
    Write-Host "  ✅ $dockerVersion" -ForegroundColor Green
    Write-Host "     You can use Docker Compose instead of local installs" -ForegroundColor Gray
} catch {
    Write-Host "  ⚠️  Docker not installed (optional)" -ForegroundColor Yellow
    Write-Host "     Download from: https://www.docker.com/products/docker-desktop/" -ForegroundColor Gray
}

Write-Host ""
Write-Host "📋 Summary:" -ForegroundColor Cyan

# Determine what's needed
$needsPython = $false
$needsNode = $false

try { python --version 2>&1 | Out-Null } catch { $needsPython = $true }
try { node --version 2>&1 | Out-Null } catch { $needsNode = $true }

if ($needsPython -or $needsNode) {
    Write-Host "  ⚠️  Missing requirements:" -ForegroundColor Yellow
    if ($needsPython) {
        Write-Host "     - Python 3.11+ (for backend)" -ForegroundColor Yellow
    }
    if ($needsNode) {
        Write-Host "     - Node.js 20+ (for frontend)" -ForegroundColor Yellow
    }
    Write-Host ""
    Write-Host "  💡 Alternative: Install Docker Desktop to run everything in containers" -ForegroundColor Cyan
} else {
    Write-Host "  ✅ All requirements met! Ready to set up the project." -ForegroundColor Green
    Write-Host ""
    Write-Host "  Next steps:" -ForegroundColor Cyan
    Write-Host "    1. cd backend" -ForegroundColor Gray
    Write-Host "    2. python -m venv venv" -ForegroundColor Gray
    Write-Host "    3. .\venv\Scripts\activate" -ForegroundColor Gray
    Write-Host "    4. pip install -r requirements.txt" -ForegroundColor Gray
    Write-Host "    5. cd ..\frontend" -ForegroundColor Gray
    Write-Host "    6. npm install" -ForegroundColor Gray
}

Write-Host ""
