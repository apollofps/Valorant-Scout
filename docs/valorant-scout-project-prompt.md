# VALORANT Scouting Report Generator

## Project Overview

Build an automated scouting report generator for competitive VALORANT teams. Given an upcoming opponent, the application analyzes their recent match data from GRID's official esports API and generates a comprehensive, coach-ready scouting report.

**Hackathon:** Sky's the Limit - Cloud9 x JetBrains Hackathon  
**Category:** Category 2 - Automated Scouting Report Generator  
**Deadline:** February 3, 2026  

---

## Core Functionality

### Input
- Opponent team name or ID
- Number of recent matches to analyze (default: 5-10)
- Optional: specific maps to focus on

### Output
A structured scouting report containing:

1. **Team Composition Tendencies**
   - Most frequently played agent compositions
   - Agent pick rates per map
   - Flex picks vs. locked roles
   - Recent composition changes/experiments

2. **Map-Specific Strategies**
   - Default site setups (attack and defense)
   - A vs B site attack frequency
   - Common post-plant positions
   - Retake tendencies

3. **Economic Patterns**
   - Pistol round strategies (attack/defense)
   - Eco round behavior (force buy vs full save)
   - Round 2 conversion rates after pistol win/loss
   - Light buy round tendencies

4. **Player Tendencies**
   - Entry fraggers and their preferred routes
   - Lurk players and timing patterns
   - Op/AWP player positioning
   - Clutch performance by player

5. **Exploitable Patterns**
   - Predictable rotations
   - Timing tells
   - Weakness against specific agent comps (if data available)

---

## Technical Architecture

### Tech Stack
- **Backend:** Python 3.11+ with FastAPI
- **Data Layer:** GRID GraphQL API integration
- **AI/LLM:** Claude API or OpenAI for report prose generation
- **Frontend:** React with TypeScript
- **Styling:** Tailwind CSS
- **Visualization:** Recharts or D3.js for data viz
- **IDE:** PyCharm Professional with Junie AI assistant

### Project Structure
```
valorant-scout/
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI entrypoint
│   │   ├── config.py            # Environment config
│   │   ├── api/
│   │   │   ├── routes/
│   │   │   │   ├── reports.py   # Report generation endpoints
│   │   │   │   └── teams.py     # Team search/lookup
│   │   │   └── dependencies.py
│   │   ├── services/
│   │   │   ├── grid_client.py   # GRID API wrapper
│   │   │   ├── data_processor.py # Raw data → insights
│   │   │   ├── report_generator.py # LLM report generation
│   │   │   └── visualizations.py # Chart data generation
│   │   ├── models/
│   │   │   ├── match.py         # Match data models
│   │   │   ├── player.py        # Player stats models
│   │   │   └── report.py        # Report output models
│   │   └── utils/
│   │       └── helpers.py
│   ├── tests/
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── TeamSearch.tsx
│   │   │   ├── ReportView.tsx
│   │   │   ├── AgentComps.tsx
│   │   │   ├── MapBreakdown.tsx
│   │   │   ├── PlayerCards.tsx
│   │   │   └── EconomyChart.tsx
│   │   ├── hooks/
│   │   ├── services/
│   │   │   └── api.ts
│   │   ├── types/
│   │   └── App.tsx
│   ├── package.json
│   └── vite.config.ts
├── docker-compose.yml
├── README.md
└── .env.example
```

---

## GRID API Integration

### Authentication
```python
# GRID uses API key authentication
headers = {
    "x-api-key": GRID_API_KEY,
    "Content-Type": "application/json"
}
```

### Key GraphQL Queries Needed

1. **Team Search**
```graphql
query SearchTeams($name: String!) {
  teams(filter: { name: { contains: $name } }) {
    id
    name
    region
    players {
      id
      nickname
    }
  }
}
```

2. **Recent Matches by Team**
```graphql
query TeamMatches($teamId: ID!, $first: Int!) {
  series(filter: { teamIds: [$teamId] }, first: $first) {
    edges {
      node {
        id
        startedAt
        teams { id, name }
        games {
          id
          map
          winner { id }
          rounds { ... }
        }
      }
    }
  }
}
```

3. **Match Details / Round Events**
```graphql
query MatchDetails($seriesId: ID!) {
  series(id: $seriesId) {
    games {
      rounds {
        number
        winner { id }
        side
        outcome
        playerStats {
          player { id, nickname }
          kills
          deaths
          assists
          agent
          economy
        }
      }
    }
  }
}
```

*Note: Exact schema depends on GRID's current API. Verify against their documentation once access is granted.*

---

## Data Processing Pipeline

### Step 1: Fetch & Normalize
```python
async def fetch_team_matches(team_id: str, n_matches: int) -> List[Match]:
    """Fetch last n matches for a team from GRID API"""
    pass

def normalize_match_data(raw_data: dict) -> Match:
    """Convert GRID response to internal Match model"""
    pass
```

### Step 2: Pattern Extraction
```python
def extract_agent_tendencies(matches: List[Match]) -> AgentTendencies:
    """
    Returns:
    - agent_pick_rates: Dict[agent, float]
    - compositions: List[Tuple[agents, frequency]]
    - player_agent_pools: Dict[player, List[agent]]
    """
    pass

def extract_site_tendencies(matches: List[Match], map_name: str) -> SiteTendencies:
    """
    Returns:
    - attack_site_distribution: {"A": 0.65, "B": 0.35}
    - defense_defaults: common setups
    """
    pass

def extract_economy_patterns(matches: List[Match]) -> EconomyPatterns:
    """
    Returns:
    - pistol_strategies: attack/defense tendencies
    - eco_behavior: force vs save rates
    - conversion_rates: after pistol win/loss
    """
    pass

def extract_player_tendencies(matches: List[Match]) -> Dict[str, PlayerTendencies]:
    """
    Returns per-player:
    - role: entry/lurk/support/op
    - first_blood_rate
    - clutch_rate
    - avg_acs
    """
    pass
```

### Step 3: Report Generation
```python
async def generate_report(
    team_name: str,
    agent_data: AgentTendencies,
    site_data: Dict[str, SiteTendencies],
    economy_data: EconomyPatterns,
    player_data: Dict[str, PlayerTendencies]
) -> ScoutingReport:
    """
    Use LLM to generate prose report from structured data.
    
    Prompt structure:
    - System: You are a professional VALORANT analyst...
    - User: Generate a scouting report for {team} based on: {structured_data}
    
    Output: Markdown report with sections for each insight area
    """
    pass
```

---

## Frontend Components

### TeamSearch
- Autocomplete search for team names
- Shows team logo, region, current roster
- Select to generate report

### ReportView
- Main container for the generated report
- Tabs or sections for each report category
- Export to PDF functionality

### AgentComps
- Visual grid of agent compositions
- Pick rate bars per agent
- Player → agent mapping

### MapBreakdown
- Map selector tabs
- Site attack distribution pie chart
- Mini-map visualization if time permits

### EconomyChart
- Line/bar chart showing eco patterns
- Pistol round stats cards
- Conversion rate indicators

### PlayerCards
- Card per player with stats
- Role badge
- Trend indicators (hot/cold)

---

## API Endpoints

```
POST /api/reports/generate
  Body: { team_id: string, n_matches?: int, maps?: string[] }
  Response: { report_id: string, status: "processing" }

GET /api/reports/{report_id}
  Response: { status: string, report?: ScoutingReport }

GET /api/teams/search?q={query}
  Response: { teams: Team[] }

GET /api/teams/{team_id}
  Response: { team: TeamDetails }
```

---

## Judging Criteria Alignment

Based on typical hackathon judging, optimize for:

1. **Innovation (25%)** - The LLM-generated prose report + pattern extraction pipeline is novel
2. **Technical Execution (25%)** - Clean code, proper error handling, tests
3. **Design/UX (20%)** - Polished UI, intuitive flow, good visualizations
4. **Usefulness (20%)** - Actually helpful for coaches, not just a demo
5. **Presentation (10%)** - 3-min video demo must be crisp

---

## MVP Milestones

### Week 1: Foundation
- [ ] Set up project structure
- [ ] GRID API access confirmed and tested
- [ ] Basic data fetching working
- [ ] Simple team search UI

### Week 2: Core Features
- [ ] Pattern extraction pipeline complete
- [ ] LLM report generation working
- [ ] Basic report display UI
- [ ] At least 2 visualization components

### Week 3: Polish & Submit
- [ ] Full UI polish
- [ ] Error handling and edge cases
- [ ] README and documentation
- [ ] Record 3-minute demo video
- [ ] Deploy (Vercel + Railway/Fly.io)
- [ ] Submit to Devpost

---

## Differentiation Ideas

1. **Comparison Mode** - "How did teams who beat them play against them?"
2. **Trend Analysis** - "Their Jett player's performance is declining over last 5 matches"
3. **Counter Recommendations** - "Based on their tendencies, consider this comp"
4. **Export Options** - PDF, shareable link, copy to clipboard
5. **Observability Dashboard** - Integrate Datadog to show pipeline health (you already know this)

---

## Environment Variables

```env
# GRID API
GRID_API_KEY=your_grid_api_key
GRID_API_URL=https://api.grid.gg/graphql

# LLM
ANTHROPIC_API_KEY=your_claude_key
# or
OPENAI_API_KEY=your_openai_key

# App
ENVIRONMENT=development
LOG_LEVEL=INFO
```

---

## Resources

- [GRID API Documentation](https://docs.grid.gg)
- [GRID GraphQL Tutorial](https://blog.grid.gg/consuming-an-esports-graphql-api-using-javascript-2c99aa9b6fb8)
- [Hackathon Devpost Page](https://cloud9-jetbrains.devpost.com)
- [JetBrains Junie Docs](https://www.jetbrains.com/help/idea/junie.html)
- [VALORANT Competitive Wiki](https://liquipedia.net/valorant/)

---

## Notes for Junie

When using Junie in PyCharm:
- Reference this document for context on project goals
- Ask Junie to help with GRID GraphQL query construction
- Use Junie for boilerplate (FastAPI routes, React components)
- Document Junie usage in README for hackathon submission

Good luck! 🎮
