# VALORANT Scouting Report Generator - UPDATED

## Project Overview

Build an automated scouting report generator for competitive VALORANT teams. Given an upcoming opponent, the application analyzes their recent match data from GRID's official esports API and generates a comprehensive, coach-ready scouting report.

**Hackathon:** Sky's the Limit - Cloud9 x JetBrains Hackathon  
**Category:** Category 2 - Automated Scouting Report Generator  
**Deadline:** February 3, 2026  

---

## 🚨 KEY CHANGES FROM ORIGINAL PROPOSAL

### 1. Corrected GRID API Queries
The original queries were speculative. Here are the correct patterns:

```graphql
# Team Search - Correct Format
query SearchTeams($name: String!, $first: Int) {
    teams(
        filter: { 
            name: { contains: $name }
            game: { eq: "val" }  # "val" for VALORANT
        }
        first: $first
    ) {
        edges {
            node {
                id
                name
                shortName
                region
                logoUrl
                players {
                    id
                    nickname
                    fullName
                    country
                }
            }
        }
    }
}

# Recent Matches - Using seriesStates (not series)
query GetTeamMatches($teamId: ID!, $first: Int) {
    seriesStates(
        filter: {
            teamIds: { in: [$teamId] }
            types: { eq: ESPORTS }
            titleIds: { eq: 13 }  # 13 = VALORANT
            finished: true
        }
        first: $first
        orderBy: { field: STARTED_AT, direction: DESC }
    ) {
        edges {
            node {
                id
                startedAt
                finishedAt
                format { type }
                tournament { id name }
                teams {
                    id
                    name
                    score
                    won
                }
                games {
                    id
                    map { name }
                    teams { id name score won side }
                    segments {
                        id
                        type
                        team { id }
                        sequenceNumber
                        players {
                            playerId
                            characterId
                            kills
                            deaths
                            assists
                            damageDealt
                            loadoutValue
                            creditsSpent
                            weapon { id name }
                        }
                    }
                }
            }
        }
    }
}
```

### 2. API Endpoint Correction
- **Base URL:** `https://api-op.grid.gg/central-data/graphql`
- **Authentication:** `x-api-key` header

### 3. Added Caching Layer
Added Redis caching to handle GRID API rate limits and improve performance.

### 4. Streaming LLM Responses
Added Server-Sent Events (SSE) for real-time report generation progress.

### 5. Enhanced UI
- VALORANT-inspired dark theme with red accents
- Animated transitions with Framer Motion
- Interactive charts with Recharts
- Mobile-responsive design

---

## Core Functionality

### Input
- Opponent team name or ID
- Number of recent matches to analyze (default: 10)
- Optional: specific maps to focus on

### Output
A structured scouting report containing:

1. **Executive Summary** (AI-generated)
   - High-level overview of team playstyle
   - Key strengths and weaknesses
   - Immediate tactical recommendations

2. **Team Composition Tendencies**
   - Agent pick rates with visual bars
   - Top 5 most-played compositions
   - Player → Agent pools
   - Flex picks (agents played by multiple players)

3. **Map-Specific Strategies**
   - Interactive map selector
   - Site attack distribution (pie chart)
   - Timing patterns (avg execute time)
   - Post-plant positions
   - Defense defaults

4. **Economic Patterns**
   - Pistol round win rates and strategies
   - Round 2 conversion rates
   - Force buy vs full save tendencies
   - Anti-eco vulnerability

5. **Player Tendencies**
   - Player cards with stats
   - Role classification
   - K/D, ADR, First Kill rates
   - Agent pools per player
   - MVP identification

6. **Exploitable Patterns** 🎯
   - Timing tells
   - Rotation patterns
   - Weak sites per map
   - Counter-strategies

---

## Technical Architecture

### Tech Stack
- **Backend:** Python 3.11+ with FastAPI
- **Data Layer:** GRID GraphQL API + Redis caching
- **AI/LLM:** Claude 3.5 Sonnet (primary) or GPT-4 (fallback)
- **Frontend:** React 18 + TypeScript + Vite
- **Styling:** Tailwind CSS + Framer Motion
- **Visualization:** Recharts
- **Deployment:** Docker Compose

### Project Structure
```
valorant-scout/
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI entrypoint
│   │   ├── config.py            # Environment config (pydantic-settings)
│   │   ├── api/routes/
│   │   │   ├── reports.py       # Report generation endpoints
│   │   │   └── teams.py         # Team search/lookup
│   │   ├── services/
│   │   │   ├── grid_client.py   # GRID API wrapper with mock fallback
│   │   │   ├── data_processor.py # Pattern extraction engine
│   │   │   └── report_generator.py # LLM integration
│   │   └── models/
│   │       ├── match.py         # Match/Game/Round models
│   │       ├── player.py        # Player stats models
│   │       ├── team.py          # Team models
│   │       └── report.py        # Report output models
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── TeamSearch.tsx   # Autocomplete search
│   │   │   ├── LoadingState.tsx # Progress animation
│   │   │   ├── ReportView.tsx   # Main report container
│   │   │   ├── AgentComps.tsx   # Agent pick rate bars
│   │   │   ├── MapBreakdown.tsx # Site distribution charts
│   │   │   ├── PlayerCards.tsx  # Player stat cards
│   │   │   └── EconomyChart.tsx # Economy visualizations
│   │   ├── services/api.ts      # API client + SSE helper
│   │   ├── types/index.ts       # TypeScript interfaces
│   │   └── App.tsx
│   ├── package.json
│   └── Dockerfile
├── docker-compose.yml
├── README.md
└── env.example
```

---

## API Endpoints

```
POST /api/reports/generate
  Body: { team_id: string, n_matches?: int, maps?: string[] }
  Response: { report_id: string, status: "processing" }

GET /api/reports/{report_id}
  Response: { status: string, progress: int, report?: ScoutingReport }

GET /api/reports/{report_id}/stream   # SSE endpoint
  Response: Server-Sent Events with progress updates

GET /api/teams/search?q={query}
  Response: { teams: Team[], query: string, count: int }

GET /api/teams/{team_id}
  Response: TeamDetails

GET /api/teams/{team_id}/matches?limit=10
  Response: { team_id: string, matches: Match[], count: int }
```

---

## Judging Criteria Optimization

### Innovation (25%)
✅ LLM-generated prose reports (not just raw stats)
✅ Pattern extraction pipeline identifies exploitable tendencies
✅ Real-time streaming for report generation UX

### Technical Execution (25%)
✅ Clean async Python with type hints
✅ Proper error handling with mock fallbacks
✅ Docker-ready deployment
✅ Redis caching for rate limit management

### Design/UX (20%)
✅ VALORANT-inspired dark theme (not generic)
✅ Smooth animations with Framer Motion
✅ Interactive data visualizations
✅ Mobile-responsive layout

### Usefulness (20%)
✅ Actually actionable for coaches
✅ Structured sections match real scouting needs
✅ Export to PDF functionality
✅ Shareable report links

### Presentation (10%)
📹 Record 3-min demo showing:
- Team search flow
- Loading animation
- Report walkthrough
- Key features highlight

---

## MVP Milestones

### Week 1: Foundation ✅
- [x] Project structure setup
- [x] GRID API integration
- [x] Basic data fetching
- [x] Team search UI

### Week 2: Core Features
- [x] Pattern extraction pipeline
- [x] LLM report generation
- [x] Report display UI
- [x] Visualization components

### Week 3: Polish & Submit
- [ ] Full UI polish
- [ ] Error handling edge cases
- [ ] PDF export
- [ ] Record 3-minute demo video
- [ ] Deploy (Vercel + Railway)
- [ ] Submit to Devpost

---

## Differentiation Ideas (Time Permitting)

1. **Comparison Mode** - Compare two teams head-to-head
2. **Trend Analysis** - "Player X's performance declining over 5 matches"
3. **Counter Recommendations** - Suggest comps to counter their tendencies
4. **Match History View** - Browse individual matches before generating report
5. **Confidence Scores** - Show how certain the analysis is based on sample size

---

## Environment Variables

```env
# GRID API
GRID_API_KEY=your_grid_api_key
GRID_API_URL=https://api-op.grid.gg/central-data/graphql

# LLM
LLM_PROVIDER=anthropic
ANTHROPIC_API_KEY=your_claude_key
OPENAI_API_KEY=your_openai_key  # fallback
LLM_MODEL=claude-3-5-sonnet-20241022

# App
ENVIRONMENT=development
LOG_LEVEL=INFO
CORS_ORIGINS=["http://localhost:5173"]

# Redis
REDIS_URL=redis://localhost:6379
CACHE_TTL_SECONDS=3600
```

---

## Quick Start Commands

```bash
# Backend
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload

# Frontend (new terminal)
cd frontend
npm install
npm run dev

# Docker (production)
docker-compose up --build
```

---

## Resources

- [GRID API Documentation](https://docs.grid.gg)
- [GRID GraphQL Endpoint](https://api-op.grid.gg/central-data/graphql)
- [Hackathon Devpost](https://cloud9-jetbrains.devpost.com)
- [VALORANT Liquipedia](https://liquipedia.net/valorant/)

---

## Notes for Development

### Mock Data
The GRID client includes mock data fallback for development without API keys:
- Set `ENVIRONMENT=development` to enable
- Searches return mock teams (Sentinels, Cloud9)
- Matches return randomized but realistic data

### Testing the Flow
1. Start backend: `uvicorn app.main:app --reload`
2. Start frontend: `npm run dev`
3. Search for "Sentinels" or "Cloud9"
4. Generate report and watch progress
5. Explore all report tabs

---

Good luck! 🎮🏆
