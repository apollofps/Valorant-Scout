# VALORANT Scout — Project Summary

**Hackathon demo summary: features, flow, and technical overview**

---

## 🎯 What It Is

**VALORANT Scout** is an automated scouting report generator for competitive VALORANT. You pick an opponent team (and optionally a tournament), and the app fetches their match data from the **GRID Esports API**, runs pattern analysis, and generates a full report—including an **AI-powered Tactical Briefing** that turns the numbers into a clear “how to win” game plan.

Built for the **Sky's the Limit — Cloud9 x JetBrains Hackathon** (Automated Scouting category).

---

## 🔥 Why We Built It

- Coaches and analysts spend hours reviewing VODs and spreadsheets before a match.
- Raw stats (win rates, pick rates, economy) don’t tell a story by themselves.
- Teams need one place that answers: *How do we beat this team on each map?*

VALORANT Scout connects **real esports data** (GRID) with **AI** (OpenAI/Claude) to produce a single, coach-ready report with both data and narrative.

---

## 👤 User Flow (Demo Script)

1. **Search** — User searches for a team by name (e.g. “Sentinels”). Results are VALORANT teams only (GRID filtered by title).
2. **Select tournament (optional)** — User can filter to a specific tournament (e.g. “VCT Americas - Stage 2 2025”) so the report focuses on recent or relevant matches.
3. **Generate report** — User clicks to generate. A **loading screen** shows live progress and stage messages (e.g. “Connecting to GRID…”, “Downloading match data (3/10)…”, “AI is generating tactical briefing…”). Progress moves through 5% → 100% with clear status text.
4. **View report** — Report opens on the **Overview** tab by default. User can switch tabs to dive into any section. The **Tactical Briefing** tab is the hero AI feature and is labeled with an **AI** badge.

End-to-end: **Pick team → (optional) filter by tournament → Generate → Read data + AI briefing.**

---

## 📂 Report Tabs & Features

### 1. Overview (default tab)

- **Executive summary** — High-level takeaway for the team.
- **Drag-and-drop widget dashboard** — Widgets for signature agents, map performance, economy snapshot, key insights, team composition, map strategies, top performers, etc. Users can reorder widgets.
- **Key insights** — Bullet-point takeaways; **Refresh** button calls the LLM again for new insight variants.
- **Data source** — Shows tournament name or “Recent Matches” and match/map counts.

*Purpose: One-screen snapshot + customizable layout.*

---

### 2. Tactical Briefing (AI — hero feature)

This is the main differentiator: an **AI-generated**, story-driven briefing, not just stats.

- **The Game Plan** — Primary win condition in one short paragraph (e.g. “Your path to victory against Sentinels”).
- **Team DNA** — Condensed team identity with:
  - **Playstyle meters** — Attack vs Defense strength (e.g. DANGEROUS / VULNERABLE).
  - **Key insight cards** — 3 short, scannable bullets extracted from the AI text.
- **Quick Wins & Critical Actions** — Bullet lists of low-effort wins and must-do actions.
- **Threats to Neutralize** — Key players to watch, with primary agent portrait, role, and counter advice.
- **Economy Intel** — Two cards: economy strength and economy weakness (e.g. pistol/eco behavior).
- **Map Playbook** — Per-map story:
  - **The Story** — Short narrative for that map.
  - **What to Expect** — Numbered tendencies.
  - **Your Response** — Checkmarked counter-strategies.
  - **Recommended agents** — With Valorant API agent portraits.
  - **Win condition** — One line per map.

*Purpose: Turn GRID data + patterns into a readable, actionable “how to beat them” doc.*

---

### 3. Agents

- **Agent pick rates** — Bar chart and list of most-played agents.
- **Top compositions** — Most common 5-agent comps with win rates and agent icons (Valorant API).
- **Map-specific compositions** — Per-map agent data and best-performing comps.
- **Flex picks** — Agents played by multiple players.
- **Player–agent pools** — Which agents each player plays, with portraits.

*Purpose: Draft and comp preparation.*

---

### 4. Maps

- **Map win rates** — Performance per map (e.g. Ascent 70%, Icebox 40%).
- **Site tendencies** — A/B (and C where relevant) attack rates, attack/defense round wins.
- **Common executes and setups** — Text summaries of attack/defense patterns per map.

*Purpose: Where they like to go and how to defend/attack.*

---

### 5. Economy

- **Pistol round** — Win rate and strategy notes.
- **Round 2** — Behavior after pistol win/loss, conversion rate.
- **Force buy vs save** — Force buy rate, eco round win rate, anti-eco loss rate.

*Purpose: When they’re strong/weak economically.*

---

### 6. Players

- **Player cards** — One card per player with:
  - **K/D, ADR, Maps** — Core stats (ADR from real or estimated damage).
  - **Combat stats** — Kills, deaths, assists.
  - **Primary agent** — With agent portrait (Valorant API).
  - **Agent pool** — Top agents with portrait + name + game count.
  - **Role** — Duelist, Controller, etc.
- **Comparison table** — All players in a table (K/D, ADR, Kills, Deaths, etc.).
- **Active vs former vs new** — Sections for “Players with VCT Match History” and “New Roster Members.”

*Purpose: Who to fear, who plays what, and how they perform.*

---

### 7. Weapons

- **Weapon kill distribution** — Vandal, Phantom, Operator, etc.
- **Rifle preference** — Vandal vs Phantom balance.
- **Eco / SMG / shotgun / sniper** — Breakdown of non-rifle kills.
- **Per-player weapon preferences** — Favorite weapon and kill/death by weapon.

*Purpose: Buy and anti-buy planning.*

---

### 8. Exploits

- **Timing tells** — When they tend to do things (e.g. fast executes).
- **Weak sites** — Map–site combinations where they struggle.
- **Counter strategies** — Text recommendations.
- **Rotation patterns** — How they move and rotate.

*Purpose: Exploitable habits and counters.*

---

### 9. Heatmaps

- **Kill heatmaps** — Where kills happen on each map (from GRID File Download when available).
- **Map minimaps** — Valorant-style map images with overlaid kill data.

*Purpose: Position and setup planning.*

---

## 🤖 AI & Data Pipeline

- **GRID Central Data (GraphQL)** — Team search, team details, match list, series state (rosters, scores, game-level stats).
- **GRID File Download API** — Round-level events: economy rounds, round outcomes, kill positions, first bloods/deaths. Used for site tendencies, heatmaps, and richer player stats (e.g. ADR when damage is available).
- **Data processor** — Aggregates matches into:
  - Agent tendencies, site tendencies, economy patterns, player stats, weapon patterns, exploitable patterns (timing, weak sites, counters).
- **Report generator** — Builds the full report and calls the **LLM** (OpenAI GPT-4 / GPT-5.2 or Anthropic Claude) to generate:
  - Tactical briefing: team identity, playstyle summary, map strategies (narrative, tendencies, counters, recommended agents, win conditions), star players, economy analysis, primary win condition, critical actions, quick wins.
- **Config** — `LLM_PROVIDER` (openai/anthropic), `LLM_MODEL`, API keys in `.env`. Supports “thinking” models (e.g. GPT-5.2) with optional `reasoning_effort`.

*Purpose: One pipeline from GRID → structured analysis → AI narrative.*

---

## 🖥 Loading & Progress UX

- **Staged progress** — Backend updates progress (5–100%) and a **stage** message (e.g. “Fetching team details…”, “Downloading match data (2/10)…”, “AI is generating tactical briefing…”).
- **Polling** — Frontend polls report status; receives `progress` and `stage`.
- **Loading screen** — Shows team logo, animated progress ring, **current stage text** (from backend), and a smooth progress bar. “Pro tips” carousel runs while waiting.
- **No 25% stall** — Progress and messages advance through fetch → process → AI so users know the app is working, especially during the long AI step.

*Purpose: Trust and clarity during 30–60+ second report generation.*

---

## 🛠 Tech Stack

| Layer      | Tech |
|-----------|------|
| Backend   | FastAPI, Python 3.11+, Pydantic, GRID GraphQL + File Download, OpenAI / Anthropic SDKs |
| Frontend  | React 18, TypeScript, Vite, Tailwind CSS, Framer Motion, Recharts, react-markdown |
| Data      | GRID API (teams, matches, series state, events), Valorant API (agent/weapon images) |
| Optional  | Docker Compose for production |

---

## 📁 Key Repo Structure

```
valorant-scout/
├── backend/
│   ├── app/
│   │   ├── api/routes/     # reports, teams
│   │   ├── models/         # report, team, player (Pydantic)
│   │   ├── services/
│   │   │   ├── grid_client.py      # GRID API + event parsing
│   │   │   ├── data_processor.py   # Pattern extraction
│   │   │   └── report_generator.py # LLM tactical briefing
│   │   ├── config.py
│   │   └── main.py
│   └── test_briefing_generation.py
├── frontend/src/
│   ├── components/         # ReportView, TacticalBriefing, PlayerCards, etc.
│   ├── services/api.ts     # generateReport, pollReportStatus, getReportStatus
│   └── types/
├── .env.example
├── README.md
└── PROJECT_SUMMARY.md      # This file
```

---

## 🏆 What Makes It Hackathon-Worthy

1. **Real data** — GRID as official esports source (teams, matches, round-level events).
2. **AI that tells a story** — Tactical Briefing is not generic; it’s grounded in that team’s agents, maps, economy, and players.
3. **Full report in one place** — Overview, Agents, Maps, Economy, Players, Weapons, Exploits, Heatmaps + AI briefing.
4. **Production-style UX** — Tournament filter, staged loading with messages, drag-and-drop overview, refreshable insights, consistent VALORANT-style UI and agent/weapon art.
5. **Configurable LLM** — Swap OpenAI/Claude and models via env; supports reasoning models for higher-quality briefings.

---

## 🚀 Quick Start (for Judges / Demo)

1. **Env** — Copy `.env.example` to `.env`; set `GRID_API_KEY` and `OPENAI_API_KEY` (or `ANTHROPIC_API_KEY`).
2. **Backend** — `cd backend && python -m venv venv && .\venv\Scripts\activate` (or `source venv/bin/activate`), `pip install -r requirements.txt`, `uvicorn app.main:app --reload`.
3. **Frontend** — `cd frontend && npm install && npm run dev`.
4. **Browser** — Open http://localhost:5173 → Search team → Select tournament (optional) → Generate → Explore Overview and **Tactical Briefing (AI)**.

---

## 📝 One-Liner for Submission

**VALORANT Scout turns GRID match data and AI into a single scouting report: pick a team, get stats plus an AI-generated “how to beat them” tactical briefing.**

---

*Built for competitive VALORANT — Cloud9 x JetBrains Hackathon.*
