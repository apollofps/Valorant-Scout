# VALORANT Scout — Hosting & Deployment Guide

How to host the full app (frontend + backend) and set environment variables.

---

## 1. Environment Variables You Need

Create a **`.env`** file in the **project root** (same folder as `docker-compose.yml`).

### Required (API keys)

| Variable | Description | Where to get it |
|----------|-------------|------------------|
| `GRID_API_KEY` | GRID Esports API key | [grid.gg/developer](https://grid.gg/developer) |
| `OPENAI_API_KEY` **or** `ANTHROPIC_API_KEY` | LLM for tactical briefing | [platform.openai.com](https://platform.openai.com) or [console.anthropic.com](https://console.anthropic.com) |

### Optional (LLM)

| Variable | Description | Default |
|----------|-------------|---------|
| `LLM_PROVIDER` | `openai` or `anthropic` | `openai` |
| `LLM_MODEL` | Model name (e.g. `gpt-4o-mini`, `gpt-5.2`, `claude-3-5-sonnet-20241022`) | Provider default |

### Optional (app)

| Variable | Description | Default |
|----------|-------------|---------|
| `ENVIRONMENT` | `development` or `production` | `development` |
| `LOG_LEVEL` | `DEBUG`, `INFO`, `WARNING`, `ERROR` | `INFO` |
| `CORS_ORIGINS` | Comma-separated frontend URLs allowed by API | `http://localhost:5173,http://localhost:3000` |

### Example `.env` (production)

```env
# Required
GRID_API_KEY=your_grid_key_here
OPENAI_API_KEY=your_openai_key_here

# LLM
LLM_PROVIDER=openai
LLM_MODEL=gpt-4o-mini

# Production
ENVIRONMENT=production
CORS_ORIGINS=https://your-domain.com,https://www.your-domain.com
```

---

## 2. Option A: Docker Compose (recommended — one server)

Runs frontend (nginx), backend (FastAPI), and Redis on one machine. Frontend proxies `/api` to the backend, so no CORS issues.

### Steps

1. **Clone and go to project**
   ```bash
   cd valorant-scout
   ```

2. **Create `.env`**
   ```bash
   cp env.example .env
   ```
   Edit `.env` and set:
   - `GRID_API_KEY`
   - `OPENAI_API_KEY` (or `ANTHROPIC_API_KEY` and `LLM_PROVIDER=anthropic`)

3. **Production URL (if you have a domain)**
   In `.env` add:
   ```env
   CORS_ORIGINS=https://your-domain.com,https://www.your-domain.com
   ENVIRONMENT=production
   ```

4. **Build and run**
   ```bash
   docker-compose up -d --build
   ```

5. **Open the app**
   - **Local:** http://localhost:3000 (frontend)  
   - API is at http://localhost:3000/api (proxied by nginx)

6. **Optional: HTTPS and domain**
   - Put a reverse proxy (e.g. Caddy or nginx) in front of Docker.
   - Proxy `https://your-domain.com` → `http://localhost:3000` and optionally `https://your-domain.com/api` → `http://localhost:8000` (or keep nginx in Docker proxying to backend).

### Docker Compose summary

| Service   | Port (host) | Role                          |
|-----------|-------------|-------------------------------|
| frontend  | 3000        | React app (nginx), proxies /api to backend |
| backend   | 8000        | FastAPI (internal)            |
| redis     | 6379        | Cache (optional)              |

`.env` is loaded by Docker Compose and passed into the backend container; you don’t need to copy it into the image.

---

## 3. Option B: Separate hosting (e.g. Vercel + Railway)

- **Frontend:** Vercel, Netlify, or Cloudflare Pages  
- **Backend:** Railway, Render, Fly.io, etc.

### Backend (e.g. Railway)

1. Deploy the **backend** (e.g. `valorant-scout/backend` with a Dockerfile or `uvicorn app.main:app --host 0.0.0.0`).
2. In the host’s dashboard, set **environment variables**:
   - `GRID_API_KEY`
   - `OPENAI_API_KEY` (or Anthropic)
   - `LLM_PROVIDER`, `LLM_MODEL` if you want
   - `CORS_ORIGINS=https://your-frontend-domain.vercel.app` (your real frontend URL)

3. Note the backend URL, e.g. `https://your-app.railway.app`.

### Frontend (e.g. Vercel)

1. The app currently uses **relative** `/api` requests. For a separate backend you need the frontend to call the **full backend URL**.
2. **Option 2a — Build-time API URL**
   - In `frontend/src/services/api.ts`, use:
     ```ts
     const API_BASE = import.meta.env.VITE_API_URL || '/api';
     ```
   - In Vercel (or your host), set **Environment Variable**:
     - Name: `VITE_API_URL`  
     - Value: `https://your-app.railway.app/api`
   - Rebuild the frontend so `VITE_API_URL` is baked in.

3. **Option 2b — Same domain (no CORS)**
   - Use a reverse proxy so that `https://your-domain.com` serves the frontend and `https://your-domain.com/api` proxies to Railway. Then the frontend can keep `API_BASE = '/api'` and you don’t need `VITE_API_URL`.

### CORS

Backend **must** allow your frontend origin. Set:

```env
CORS_ORIGINS=https://your-frontend.vercel.app
```

(Add all domains that will load the app, comma-separated.)

---

## 4. Option C: Single VPS (Ubuntu / Debian)

1. **Server:** Get a VPS and SSH in.

2. **Install Docker and Docker Compose**
   ```bash
   sudo apt update && sudo apt install -y docker.io docker-compose-v2
   sudo usermod -aG docker $USER
   # Log out and back in
   ```

3. **Upload project**
   ```bash
   scp -r valorant-scout user@your-server-ip:~/
   ```

4. **On the server**
   ```bash
   cd ~/valorant-scout
   cp env.example .env
   nano .env   # set GRID_API_KEY, OPENAI_API_KEY, CORS_ORIGINS (your domain), ENVIRONMENT=production
   docker compose up -d --build
   ```

5. **Optional: HTTPS with Caddy**
   ```bash
   sudo apt install caddy
   sudo nano /etc/caddy/Caddyfile
   ```
   Example:
   ```
   your-domain.com {
     reverse_proxy localhost:3000
   }
   ```
   Then: `sudo systemctl reload caddy`

6. **Firewall**
   ```bash
   sudo ufw allow 80
   sudo ufw allow 443
   sudo ufw allow 22
   sudo ufw enable
   ```

---

## 5. Checklist Before Going Live

- [ ] `.env` has `GRID_API_KEY` and `OPENAI_API_KEY` (or Anthropic).
- [ ] `CORS_ORIGINS` includes your real frontend URL(s) (no trailing slash).
- [ ] `ENVIRONMENT=production` if you want production behavior.
- [ ] For Docker: `.env` is in the same directory as `docker-compose.yml`.
- [ ] If you use a separate frontend host: `VITE_API_URL` set and frontend rebuilt, or API proxied under same domain.

---

## 6. Quick Reference

| Task | Command / Action |
|------|-------------------|
| Run with Docker | `docker-compose up -d --build` |
| View logs | `docker-compose logs -f` |
| Stop | `docker-compose down` |
| Restart after changing `.env` | `docker-compose up -d` (no need to rebuild unless code changed) |

---

**Summary:** Easiest path is **Option A**: put a `.env` next to `docker-compose.yml` with your API keys and production URLs in `CORS_ORIGINS`, then run `docker-compose up -d --build`. The site is served on port 3000 with API at `/api`.
