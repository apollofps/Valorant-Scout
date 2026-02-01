# Free Online Hosting — VALORANT Scout

Host the app **for free** on the cloud (no credit card for these options).

**Stack:** **Render** (backend) + **Vercel** (frontend). Both have free tiers.

---

## What You Get

| Service | Free tier | Limit |
|--------|-----------|--------|
| **Render** (backend) | Free Web Service | 750 hrs/month, **sleeps after 15 min** inactivity (~30–60 sec cold start) |
| **Vercel** (frontend) | Free | Generous bandwidth, no sleep |

**Note:** First report after idle may take 30–60 seconds while the backend wakes up. After that it’s fast until idle again.

---

## Step 1: Push Code to GitHub

1. Create a repo (e.g. `valorant-scout`).
2. Push your project:
   ```bash
   cd valorant-scout   # or c9sky, your project root
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/YOUR_USERNAME/valorant-scout.git
   git push -u origin main
   ```
3. Repo layout should have `backend/` and `frontend/` at the root (or `valorant-scout/backend` and `valorant-scout/frontend` if the repo root is the parent folder).

---

## Step 2: Deploy Backend on Render (free)

1. Go to [render.com](https://render.com) → Sign up (GitHub).
2. **New** → **Web Service**.
3. Connect your GitHub repo.
4. Settings:
   - **Name:** `valorant-scout-api` (or any name).
   - **Region:** Choose closest to you.
   - **Root Directory:** `valorant-scout` if your repo root is the parent; otherwise leave blank (or `backend` if repo root is `valorant-scout` and backend is in `backend`).
   - **Runtime:** **Python 3**.
   - **Build Command:**
     ```bash
     pip install -r requirements.txt
     ```
     If Render uses `backend` as root, the `requirements.txt` there is used. If your repo root is `valorant-scout`, set **Root Directory** to `valorant-scout` and **Build Command** to:
     ```bash
     cd backend && pip install -r requirements.txt
     ```
   - **Start Command:**
     ```bash
     cd backend && uvicorn app.main:app --host 0.0.0.0 --port $PORT
     ```
     If **Root Directory** is already `backend`, use:
     ```bash
     uvicorn app.main:app --host 0.0.0.0 --port $PORT
     ```
5. **Environment** (required):
   - `GRID_API_KEY` = your GRID key  
   - `OPENAI_API_KEY` = your OpenAI key (or add `ANTHROPIC_API_KEY` and set `LLM_PROVIDER=anthropic`)  
   - `LLM_PROVIDER` = `openai` (or `anthropic`)  
   - `LLM_MODEL` = `gpt-4o-mini` (or your model)  
   - **Do not set CORS yet** — we’ll add it after the frontend is deployed.
6. Click **Create Web Service**. Wait for the first deploy.
7. Copy your backend URL, e.g. `https://valorant-scout-api.onrender.com`.

**Set CORS after frontend is live:**

- In Render → your service → **Environment** → add:
  - `CORS_ORIGINS` = `https://your-app.vercel.app` (replace with your real Vercel URL; comma-separated if you have more).

---

## Step 3: Deploy Frontend on Vercel (free)

1. Go to [vercel.com](https://vercel.com) → Sign up (GitHub).
2. **Add New** → **Project** → Import your same GitHub repo.
3. Settings:
   - **Root Directory:** Click **Edit** → set to `valorant-scout` if your repo has a `valorant-scout` folder at root; otherwise leave as repo root (and use `frontend` as root if your app is in `frontend`).
   - **Framework Preset:** Vite.
   - **Build Command:** `npm run build` (default).
   - **Output Directory:** `dist` (default).
   - **Install Command:** `npm install` (default).
4. **Environment Variables** (Vercel dashboard → your project → Settings → Environment Variables):
   - Name: `VITE_API_URL`  
   - Value: `https://valorant-scout-api.onrender.com/api` (your Render backend URL + `/api`)  
   - Environment: Production (and Preview if you want).
5. **Root Directory:** If the frontend lives in `frontend/`, set **Root Directory** to `frontend`. Then Vercel will run `npm install` and `npm run build` inside `frontend/`.
6. Deploy. Copy your frontend URL, e.g. `https://valorant-scout.vercel.app`.

---

## Step 4: Point Backend CORS at Frontend

1. Render → your backend service → **Environment**.
2. Add (or update):
   - `CORS_ORIGINS` = `https://valorant-scout.vercel.app` (your real Vercel URL, no trailing slash).
3. Save. Render will redeploy automatically.

---

## Repo Layout Reference

If your **repo root** is the folder that contains `backend` and `frontend`:

- **Render**
  - Root Directory: *(leave blank)*
  - Build: `cd backend && pip install -r requirements.txt`
  - Start: `cd backend && uvicorn app.main:app --host 0.0.0.0 --port $PORT`
- **Vercel**
  - Root Directory: `frontend`

If your **repo root** is `valorant-scout` (so you have `valorant-scout/backend` and `valorant-scout/frontend`):

- **Render**
  - Root Directory: `valorant-scout`
  - Build: `cd backend && pip install -r requirements.txt`
  - Start: `cd backend && uvicorn app.main:app --host 0.0.0.0 --port $PORT`
- **Vercel**
  - Root Directory: `valorant-scout/frontend`

---

## Env Vars Checklist

**Render (backend)**  
- `GRID_API_KEY`  
- `OPENAI_API_KEY` (or `ANTHROPIC_API_KEY` + `LLM_PROVIDER=anthropic`)  
- `LLM_PROVIDER` (optional, default `openai`)  
- `LLM_MODEL` (optional)  
- `CORS_ORIGINS` = your Vercel URL (e.g. `https://valorant-scout.vercel.app`)

**Vercel (frontend)**  
- `VITE_API_URL` = `https://your-render-url.onrender.com/api`

---

## Optional: Render Blueprint (single config file)

You can define the backend in a `render.yaml` at the repo root so Render can create the service from it.

Create **`render.yaml`** in the repo root (same level as `backend/` and `frontend/`):

```yaml
services:
  - type: web
    name: valorant-scout-api
    runtime: python
    rootDir: backend
    buildCommand: pip install -r requirements.txt
    startCommand: uvicorn app.main:app --host 0.0.0.0 --port $PORT
    envVars:
      - key: GRID_API_KEY
        sync: false
      - key: OPENAI_API_KEY
        sync: false
      - key: CORS_ORIGINS
        sync: false
      - key: LLM_PROVIDER
        value: openai
      - key: LLM_MODEL
        value: gpt-4o-mini
```

Then in Render: **New** → **Blueprint** → connect repo. You’ll still need to set secret env vars (e.g. `GRID_API_KEY`, `OPENAI_API_KEY`, `CORS_ORIGINS`) in the dashboard.

---

## Summary

1. Push code to GitHub.  
2. Render: new Web Service, Python, build/start as above, set env (including CORS after you have the frontend URL).  
3. Vercel: import repo, set root to frontend folder, add `VITE_API_URL`, deploy.  
4. Set `CORS_ORIGINS` on Render to your Vercel URL.

After that, the site runs fully in the cloud for free (with backend spin-down on Render after 15 min idle).
