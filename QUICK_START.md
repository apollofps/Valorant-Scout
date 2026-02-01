# 🚀 Quick Start Guide

## Prerequisites

- Python 3.11+ installed
- Node.js 20+ installed
- API keys (optional for testing with mocks)

## Step 1: Backend Setup

```powershell
# Navigate to backend
cd valorant-scout\backend

# Create virtual environment
python -m venv venv

# Activate virtual environment (Windows)
.\venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create .env file (copy from env.example in root)
# Add your API keys:
# GRID_API_KEY=your_key_here
# ANTHROPIC_API_KEY=your_key_here

# Start the server
uvicorn app.main:app --reload
```

Backend will run on: http://localhost:8000

## Step 2: Frontend Setup

```powershell
# Open new terminal, navigate to frontend
cd valorant-scout\frontend

# Install dependencies
npm install

# Start dev server
npm run dev
```

Frontend will run on: http://localhost:5173

## Step 3: Test the Application

1. Open http://localhost:5173 in your browser
2. Search for a team (e.g., "Sentinels" or "Cloud9")
3. Click on a team to generate a report
4. Watch the loading animation
5. Explore the generated report

## Testing Without API Keys

The app includes mock data for development:
- Set `ENVIRONMENT=development` in `.env`
- Mock teams will be returned for searches
- Mock match data will be used for reports

## Troubleshooting

### Backend Issues
- **Import errors**: Make sure you're in the `backend` directory and venv is activated
- **Port already in use**: Change port with `--port 8001`
- **Missing dependencies**: Run `pip install -r requirements.txt` again

### Frontend Issues
- **Module not found**: Run `npm install` again
- **TypeScript errors**: Check that all types are imported correctly
- **Build errors**: Clear node_modules and reinstall

## Next Steps

1. Get real API keys from:
   - GRID: https://grid.gg/developer
   - Anthropic: https://console.anthropic.com
2. Test with real data
3. Customize the UI
4. Deploy to production

## Docker (Alternative)

```powershell
# From project root
docker-compose up --build
```

This will start:
- Backend on port 8000
- Frontend on port 3000
- Redis on port 6379
