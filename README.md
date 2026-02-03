# 🎮 VALORANT Scout

> **Automated Scouting Report Generator for Competitive VALORANT Teams**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Hackathon](https://img.shields.io/badge/Hackathon-Cloud9%20x%20JetBrains-blue)](https://cloud9-jetbrains.devpost.com)
[![Category](https://img.shields.io/badge/Category-Automated%20Scouting-red)](https://cloud9-jetbrains.devpost.com)

**License:** This project is open source under the [MIT License](LICENSE).

Generate comprehensive, coach-ready scouting reports powered by GRID's official esports data and AI analysis.

![VALORANT Scout Demo](./docs/demo.gif)

---

## ✨ Features

- 🔍 **Team Search** - Find any professional VALORANT team
- 📊 **Pattern Analysis** - Extract agent compositions, site tendencies, economic patterns
- 🤖 **AI-Powered Reports** - LLM-generated prose insights with Claude/GPT-4
- 📈 **Interactive Visualizations** - Charts, graphs, and data breakdowns
- 📱 **Beautiful UI** - VALORANT-inspired dark theme with animations
- 📤 **Export Options** - PDF export and shareable links

---

## 🚀 Quick Start

### Prerequisites

- Python 3.11+
- Node.js 20+
- GRID API Key ([Get one here](https://grid.gg/developer))
- Anthropic API Key or OpenAI API Key

### Setup

1. **Clone and configure**
   ```bash
   cd valorant-scout
   cp .env.example .env
   # Edit .env with your API keys
   ```

2. **Start Backend**
   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   uvicorn app.main:app --reload
   ```

3. **Start Frontend**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

4. **Open** http://localhost:5173

### Docker (Production)

```bash
docker-compose up --build
```

---

## 📖 How It Works

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Team       │ ──▶ │  GRID API   │ ──▶ │  Pattern    │ ──▶ │  LLM        │
│  Search     │     │  Fetch      │     │  Analysis   │     │  Report     │
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
```

1. **Search** - Find your opponent team
2. **Fetch** - Pull recent match data from GRID's esports API
3. **Analyze** - Extract patterns (agents, maps, economy, players)
4. **Generate** - Create AI-powered prose report with insights

---

## 📊 Report Sections

| Section | Description |
|---------|-------------|
| **Executive Summary** | High-level overview of team playstyle |
| **Agent Compositions** | Pick rates, common comps, flex picks |
| **Map Strategies** | Site preferences, timing patterns, setups |
| **Economy Patterns** | Pistol strategies, force buy rates |
| **Player Tendencies** | Role classification, key stats, hot/cold form |
| **Exploitable Patterns** | Timing tells, weaknesses, counter-strategies |

---

## 🛠 Tech Stack

### Backend
- **FastAPI** - High-performance Python API framework
- **GRID GraphQL** - Official esports data source
- **Anthropic Claude / OpenAI GPT-4** - LLM for report generation
- **Pydantic** - Data validation and serialization

### Frontend
- **React 18** - UI framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Utility-first styling
- **Framer Motion** - Animations
- **Recharts** - Data visualization

---

## 🔧 Configuration

See `.env.example` for all configuration options:

| Variable | Description | Required |
|----------|-------------|----------|
| `GRID_API_KEY` | GRID Esports API key | Yes |
| `ANTHROPIC_API_KEY` | Claude API key | Yes* |
| `OPENAI_API_KEY` | OpenAI API key | Yes* |
| `LLM_PROVIDER` | "anthropic" or "openai" | No |

*One of ANTHROPIC_API_KEY or OPENAI_API_KEY required

---

## 📁 Project Structure

Repo root layout:

```
├── backend/           # FastAPI API
│   ├── app/
│   │   ├── api/routes/      # FastAPI endpoints
│   │   ├── models/          # Pydantic data models
│   │   ├── services/        # grid_client, data_processor, report_generator
│   │   ├── config.py
│   │   └── main.py
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/          # React + Vite
│   ├── src/
│   │   ├── components/
│   │   ├── services/
│   │   ├── types/
│   │   └── App.tsx
│   ├── package.json
│   └── vite.config.ts
├── .github/workflows/ # CI (e.g. deploy-pages.yml)
├── docs/              # Project docs, summaries
├── docker-compose.yml
├── env.example
├── render.yaml
└── README.md
```

---

## 🎯 API Endpoints

```
POST /api/reports/generate     Generate a new scouting report
GET  /api/reports/{id}         Get report status and data
GET  /api/reports/{id}/stream  Stream report generation (SSE)

GET  /api/teams/search?q=      Search for teams
GET  /api/teams/{id}           Get team details
GET  /api/teams/{id}/matches   Get recent matches
```

---

## 🏆 Hackathon Submission

**Sky's the Limit - Cloud9 x JetBrains Hackathon**

- **Category**: Automated Scouting Report Generator
- **Deadline**: February 3, 2026

### What Makes This Stand Out

1. **Real Data** - Uses official GRID esports API
2. **AI-Powered Insights** - Not just stats, but actionable prose
3. **Beautiful UX** - VALORANT-themed, animated, professional
4. **Production Ready** - Docker, caching, error handling

---

## 🤝 Contributing

This is a hackathon project, but PRs are welcome!

---

## 📝 License

This project is licensed under the **MIT License**. See the [LICENSE](LICENSE) file in the root of this repository for the full text.

---

## 🙏 Credits

- [GRID Esports](https://grid.gg) - Official data provider
- [Cloud9](https://cloud9.gg) & [JetBrains](https://jetbrains.com) - Hackathon hosts
- [Riot Games](https://playvalorant.com) - VALORANT

---

**Built with ❤️ for competitive VALORANT**
