# Full Deployment Guide — VALORANT Scout

One guide to get the app live: **backend on Render**, **frontend on GitHub Pages**. All steps in order.

---

## Table of contents

1. [Prerequisites](#1-prerequisites)
2. [Repo layout (current)](#2-repo-layout-current)
3. [Part A: Deploy backend on Render](#3-part-a-deploy-backend-on-render)
4. [Part B: Deploy frontend on GitHub Pages](#4-part-b-deploy-frontend-on-github-pages)
5. [Connect backend and frontend (CORS + API URL)](#5-connect-backend-and-frontend-cors--api-url)
6. [Verify and test](#6-verify-and-test)
7. [Environment variables reference](#7-environment-variables-reference)
8. [Troubleshooting](#8-troubleshooting)
9. [Optional: Vercel instead of GitHub Pages](#9-optional-vercel-instead-of-github-pages)
10. [Alternative: DigitalOcean ($200 credit) or Heroku ($13/m)](#10-alternative-digitalocean-200-credit-or-heroku-13m)

---

## 1. Prerequisites

- **GitHub:** Account and repo with code pushed (e.g. `main` branch).
- **Render:** Free account — [render.com](https://render.com) (sign up with GitHub).
- **API keys (for backend):**
  - **GRID API key** — [grid.gg/developer](https://grid.gg/developer)
  - **OpenAI** or **Anthropic** key — for AI tactical briefing  
    - OpenAI: [platform.openai.com](https://platform.openai.com)  
    - Anthropic: [console.anthropic.com](https://console.anthropic.com)

---

## 2. Repo layout (current)

Your repo root is the project root. No extra wrapper folder.

```
your-repo/                    ← repo root (e.g. c9sky)
├── .github/
│   └── workflows/
│       └── deploy-pages.yml
├── backend/
│   ├── app/
│   ├── requirements.txt
│   └── ...
├── frontend/
│   ├── src/
│   ├── package.json
│   ├── vite.config.ts
│   └── ...
├── env.example
├── render.yaml
└── ...
```

All steps below assume this layout.

---

## 3. Part A: Deploy backend on Render

### 3.1 Create the Web Service

1. Go to [dashboard.render.com](https://dashboard.render.com) → **New +** → **Web Service**.
2. Connect your **GitHub** account if needed, then select the repo that contains `backend/` and `frontend/`.
3. Use these settings:

| Field | Value |
|--------|--------|
| **Name** | `valorant-scout-api` (or any name; you’ll use this in the URL) |
| **Region** | Choose one close to you |
| **Root Directory** | `backend` |
| **Runtime** | **Python 3** |
| **Build Command** | `pip install -r requirements.txt` |
| **Start Command** | `uvicorn app.main:app --host 0.0.0.0 --port $PORT` |

4. Click **Advanced** and leave **Instance Type** as **Free**.

### 3.2 Environment variables (Render)

In the same creation screen (or later: service → **Environment**), add:

| Key | Value | Secret? |
|-----|--------|--------|
| `GRID_API_KEY` | Your GRID API key | Yes (toggle **Secret**) |
| `OPENAI_API_KEY` | Your OpenAI key (if using OpenAI) | Yes |
| **or** `ANTHROPIC_API_KEY` | Your Anthropic key (if using Claude) | Yes |
| `LLM_PROVIDER` | `openai` or `anthropic` | No |
| `LLM_MODEL` | e.g. `gpt-4o-mini` or `claude-3-5-sonnet-20241022` | No |
| `CORS_ORIGINS` | Leave empty for now; set after frontend is live (see [Section 5](#5-connect-backend-and-frontend-cors--api-url)) | No |

- You only need one of `OPENAI_API_KEY` or `ANTHROPIC_API_KEY`; set `LLM_PROVIDER` to match.
- Do **not** add a trailing slash to URLs.

### 3.3 Deploy and copy backend URL

1. Click **Create Web Service**.
2. Wait until the build and deploy succeed (logs should show “Your service is live”).
3. Copy the service URL, e.g. **`https://valorant-scout-api.onrender.com`** (no trailing slash).  
   You will use this for:
   - GitHub variable `VITE_API_URL` = `https://valorant-scout-api.onrender.com/api`
   - CORS = your GitHub Pages origin

**Render free tier:** The service sleeps after ~15 minutes of no traffic. First request after that may take 30–60 seconds (cold start).

---

## 4. Part B: Deploy frontend on GitHub Pages

### 4.1 Tell the frontend where the API is

The frontend is built with `VITE_API_URL` so it can call your Render backend.

1. On GitHub: open your repo → **Settings** → **Secrets and variables** → **Actions**.
2. Open the **Variables** tab → **New repository variable**.
3. Create:
   - **Name:** `VITE_API_URL`
   - **Value:** `https://YOUR-RENDER-APP.onrender.com/api`  
     Example: `https://valorant-scout-api.onrender.com/api`  
     - Use your real Render URL.
     - Path must be `/api` (no trailing slash).

4. Click **Add variable**.

### 4.2 Turn on GitHub Pages (Actions)

1. Same repo → **Settings** → **Pages**.
2. Under **Build and deployment**:
   - **Source:** **GitHub Actions**.
3. Save.

No need to set a branch or folder; the workflow will build and deploy.

### 4.3 Trigger the deploy

- **Automatic:** Push to `main`, e.g.  
  `git push origin main`
- **Manual:** **Actions** tab → workflow **“Deploy to GitHub Pages”** → **Run workflow** → choose `main` → **Run workflow**.

Wait until the workflow run is green. Your site will be at:

**`https://<YOUR_GITHUB_USERNAME>.github.io/<REPO_NAME>/`**

Example: `https://jane.github.io/c9sky/`

- Use the full path including `/<REPO_NAME>/`.  
- If the page is blank, open that full URL (see [Troubleshooting](#8-troubleshooting)).

---

## 5. Connect backend and frontend (CORS + API URL)

The browser will only allow the frontend (GitHub Pages) to call the backend if the backend allows that origin (CORS).

### 5.1 Set CORS on Render

1. Render Dashboard → your backend service → **Environment**.
2. Add or edit:
   - **Key:** `CORS_ORIGINS`
   - **Value:** `https://YOUR_GITHUB_USERNAME.github.io`  
     Example: `https://jane.github.io`  
     - No trailing slash.
     - No path (e.g. not `/c9sky`).
3. Save. Render will redeploy with the new env.

Our backend accepts a comma-separated list, so you can add multiple origins later if needed (e.g. a custom domain).

### 5.2 Confirm API URL (GitHub)

- In GitHub: **Settings** → **Secrets and variables** → **Actions** → **Variables**.
- Ensure **VITE_API_URL** = `https://YOUR-RENDER-APP.onrender.com/api`.

If you change it, push a commit to `main` or run the **Deploy to GitHub Pages** workflow again so the frontend is rebuilt with the new URL.

---

## 6. Verify and test

1. **Backend**
   - Open `https://YOUR-RENDER-APP.onrender.com/docs` in a browser. You should see FastAPI Swagger UI.
   - Optional: `https://YOUR-RENDER-APP.onrender.com/health` or similar if you have a health route.

2. **Frontend**
   - Open `https://YOUR_USERNAME.github.io/REPO_NAME/` (with the repo path).
   - Use the app: search, generate a report. First request after idle may be slow (Render cold start).

3. **CORS**
   - If the app loads but “generating report” or API calls fail with CORS errors in the browser console (F12 → Console), double-check `CORS_ORIGINS` on Render and that you used the origin without path: `https://YOUR_USERNAME.github.io`.

---

## 7. Environment variables reference

### Backend (Render)

| Variable | Required | Description |
|----------|----------|-------------|
| `GRID_API_KEY` | Yes | GRID API key |
| `OPENAI_API_KEY` | If using OpenAI | OpenAI API key |
| `ANTHROPIC_API_KEY` | If using Anthropic | Anthropic API key |
| `LLM_PROVIDER` | No | `openai` or `anthropic` (default: `openai`) |
| `LLM_MODEL` | No | e.g. `gpt-4o-mini`, `claude-3-5-sonnet-20241022` |
| `CORS_ORIGINS` | Yes in production | Comma-separated origins, e.g. `https://user.github.io` |
| `ENVIRONMENT` | No | `production` (optional) |

### Frontend (GitHub Actions)

| Variable | Where | Description |
|----------|--------|-------------|
| `VITE_API_URL` | Repo **Settings** → **Actions** → **Variables** | Backend API base, e.g. `https://your-app.onrender.com/api` |
| `VITE_BASE_PATH` | Set by workflow | `/${{ repo.name }}/` for GitHub Pages; don’t set manually. |

---

## 8. Troubleshooting

### Frontend: blank page or 404

- Open the **full** URL: `https://USERNAME.github.io/REPO_NAME/` (including repo name).
- Hard refresh: Ctrl+Shift+R (Windows/Linux) or Cmd+Shift+R (Mac).
- Check **Actions** tab: “Deploy to GitHub Pages” run must have succeeded.

### API calls fail / CORS errors

- In Render → **Environment**: `CORS_ORIGINS` must be exactly `https://YOUR_USERNAME.github.io` (no path, no trailing slash).
- Redeploy the backend after changing env.

### “Failed to fetch” or network errors

- Confirm **VITE_API_URL** in GitHub Actions variables = `https://YOUR-RENDER-APP.onrender.com/api`.
- Re-run the Pages workflow (or push a commit) so the frontend is rebuilt with the correct URL.

### Backend runs out of memory on Render

- Render free tier has **512 MB RAM**. The repo is tuned to stay under that:
  - **pandas/numpy** are not used and are omitted from `requirements.txt` (they would add ~100MB+).
  - Start command uses **`--workers 1`** so only one uvicorn worker runs.
  - **WEB_CONCURRENCY=1** is set in the blueprint.
- If you still hit OOM: in Render Dashboard → service → **Settings** consider moving to a paid instance with more RAM, or remove any extra heavy dependencies.

### Backend very slow on first request

- Render free tier spins down after ~15 min inactivity. First request can take 30–60 s. Subsequent requests are fast until idle again.

### Build fails on Render (e.g. pandas / C++ compile error)

- Render defaults to **Python 3.13**; pandas and some other packages may not have wheels yet and fail when building from source. Pin to **Python 3.12**:
  - Repo has a **`.python-version`** file at the repo root with `3.12.4`. Ensure it’s committed and pushed.
  - Or in Render Dashboard → your service → **Environment** → add **PYTHON_VERSION** = `3.12.4`, then redeploy.
- Ensure **Root Directory** is `backend` and **Build Command** is `pip install -r requirements.txt`.
- Check **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT --workers 1`.

### Build fails on GitHub Actions

- Ensure **VITE_API_URL** is set under **Actions** → **Variables** (not Secrets, unless your workflow uses secrets).
- Check that the workflow file is in `.github/workflows/deploy-pages.yml` and that the default branch is `main` (or update the workflow’s `branches` to match).

---

### GRID API rate limit ("You have exceeded your rate limit" / ENHANCE_YOUR_CALM)

- The error is from **GRID** (grid.gg), not from multiple instances. The same API key is rate-limited across all use (local + cloud).
- The app now **retries** on rate limit with long backoff (30s, 60s, 120s, up to 5 attempts). Deploy the latest backend to get this.
- If you still hit the limit: wait a few minutes and try again, or generate fewer reports in a short time. For higher limits, check GRID's developer plan.

---

## 9. Optional: Vercel instead of GitHub Pages

If you prefer Vercel for the frontend:

1. Deploy the **backend** on Render exactly as in [Part A](#3-part-a-deploy-backend-on-render).
2. On [vercel.com](https://vercel.com): **Add New** → **Project** → import the same repo.
3. Set **Root Directory** to **`frontend`**.
4. In **Environment Variables** add:
   - `VITE_API_URL` = `https://YOUR-RENDER-APP.onrender.com/api`  
   (Production and Preview if you want.)
5. Deploy. Copy the Vercel URL (e.g. `https://your-app.vercel.app`).
6. In Render → your backend → **Environment**: set  
   `CORS_ORIGINS` = `https://your-app.vercel.app`  
   (no trailing slash).

No GitHub Actions or GitHub Pages settings are needed for the frontend if you use Vercel.

---

## 10. Alternative: DigitalOcean ($200 credit) or Heroku ($13/m)

If you have **$200 DigitalOcean credit** or **$13/month Heroku**, you can host the backend there instead of Render. Both give more RAM than Render’s free tier and avoid OOM.

| Option | Best for | RAM / cost |
|--------|----------|------------|
| **DigitalOcean** | Using $200 credit; more control | App Platform ~512MB–1GB; Droplet 1GB+ from ~$6/mo |
| **Heroku** | Simple deploy, $13/m budget | Basic dyno 512MB–1GB; Eco/Basic ~$5–7/dyno |

Frontend stays on **GitHub Pages**; set **VITE_API_URL** to your new backend URL (e.g. `https://your-app.herokuapp.com/api` or your DO URL + `/api`) and **CORS_ORIGINS** on the backend to `https://YOUR_USERNAME.github.io`.

---

### 10.1 DigitalOcean App Platform (recommended with credit)

1. Go to [cloud.digitalocean.com](https://cloud.digitalocean.com) → **App Platform** → **Create App**.
2. Connect GitHub and select your repo.
3. **Resources:** add a **Web Service** (not static).
4. **Source:**
   - **Root Directory:** `backend`
   - **Build Command:** `pip install -r requirements.txt`
   - **Run Command:** `uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8080} --workers 1`
5. **Environment:** Add (DO usually sets **PORT**; if not, set **PORT** = `8080`). Add:
   - `GRID_API_KEY`, `OPENAI_API_KEY` or `ANTHROPIC_API_KEY`, `LLM_PROVIDER`, `LLM_MODEL`
   - `CORS_ORIGINS` = `https://YOUR_USERNAME.github.io`
6. **Health check (fixes "connection refused" on port 8000):** The probe port is set in the **App Spec** (YAML), not a separate "Health Check" page. In the app → **App Spec** tab (or **Edit your app spec**), add `http_port: 8080` to your service and optionally `health_check: { port: 8080, http_path: /health }`. See [docs/DIGITALOCEAN_HEALTH_CHECK.md](docs/DIGITALOCEAN_HEALTH_CHECK.md) for step-by-step.
7. Deploy. Copy the app URL and use **VITE_API_URL** = `https://your-app-xxxxx.ondigitalocean.app/api` in GitHub Actions.

**If the app keeps crashing / restarting:** Increase instance size. In App Spec add **instance_size_slug: basic-xs** (1 GB) or **basic-s** (2 GB) under your service; or in the dashboard: Resources → Web Service → **Instance size** / **Plan** → choose a larger tier. See [docs/DIGITALOCEAN_HEALTH_CHECK.md](docs/DIGITALOCEAN_HEALTH_CHECK.md#if-the-app-keeps-crashing--restarting-oom).

**Note:** If App Platform doesn’t allow root directory `backend`, use repo root and set **Run Command** to `cd backend && uvicorn app.main:app --host 0.0.0.0 --port $PORT --workers 1` and ensure the build installs from `backend/requirements.txt` (e.g. build command: `pip install -r backend/requirements.txt`).

---

### 10.2 Heroku ($13/m)

The repo includes **Procfile**, **runtime.txt**, and root **requirements.txt** (which points at `backend/requirements.txt`) so Heroku can build and run the backend.

1. Install [Heroku CLI](https://devcenter.heroku.com/articles/heroku-cli) and run `heroku login`.
2. From your repo root:
   ```bash
   heroku create your-app-name
   heroku buildpacks:set heroku/python
   ```
3. Set config vars (env):
   ```bash
   heroku config:set GRID_API_KEY=your_key
   heroku config:set OPENAI_API_KEY=your_key
   heroku config:set CORS_ORIGINS=https://YOUR_USERNAME.github.io
   heroku config:set LLM_PROVIDER=openai
   heroku config:set LLM_MODEL=gpt-4o-mini
   ```
4. Deploy:
   ```bash
   git push heroku main
   ```
5. Backend URL will be `https://your-app-name.herokuapp.com`. In GitHub Actions set **VITE_API_URL** = `https://your-app-name.herokuapp.com/api`.

**CORS:** Set `CORS_ORIGINS` to your GitHub Pages origin (e.g. `https://apollofps.github.io`) so the frontend can call the API.

---

## Quick checklist

- [ ] Backend: Render Web Service, Root Directory = `backend`, env vars set (including `CORS_ORIGINS` after frontend is live).
- [ ] Backend URL copied (e.g. `https://valorant-scout-api.onrender.com`).
- [ ] GitHub: **VITE_API_URL** = `https://YOUR-RENDER-APP.onrender.com/api` (Actions → Variables).
- [ ] GitHub: **Pages** → Source = **GitHub Actions**.
- [ ] Pushed to `main` or ran “Deploy to GitHub Pages” workflow.
- [ ] CORS on Render = `https://YOUR_USERNAME.github.io`.
- [ ] Opened site at `https://USERNAME.github.io/REPO_NAME/` and tested a report.

---

**Summary**

| What | Where | URL |
|------|--------|-----|
| Frontend | GitHub Pages | `https://USERNAME.github.io/REPO_NAME/` |
| Backend | Render | `https://your-app.onrender.com` |
| API base (used by frontend) | — | `https://your-app.onrender.com/api` |

For more detail on env vars and local setup, see **env.example** and **README.md**.
