# Deploy Frontend to GitHub Pages

Use **GitHub Pages** for the frontend (free, no sleep). The **backend must still run elsewhere** (e.g. Render) because GitHub Pages only serves static files.

**Result:** `https://YOUR_USERNAME.github.io/valorant-scout/` (or your repo name)

---

## 1. Backend first (required)

GitHub Pages cannot run the FastAPI backend. Host it on **Render** (free):

1. Follow [FREE_HOSTING.md](./FREE_HOSTING.md) **Step 2** to deploy the backend on Render.
2. Copy your backend URL, e.g. `https://valorant-scout-api.onrender.com`.
3. You’ll need this URL for the frontend env and for CORS.

---

## 2. Repo setup

Your repo should look like:

```
your-repo/
├── .github/workflows/deploy-pages.yml   # already added
├── frontend/
│   ├── src/
│   ├── package.json
│   ├── vite.config.ts
│   └── ...
├── backend/
│   └── ...
└── ...
```

Push the workflow and code to GitHub (e.g. `main` branch).

---

## 3. Set backend URL in GitHub

The frontend must call your Render backend. Set the API URL in the repo:

1. GitHub repo → **Settings** → **Secrets and variables** → **Actions**.
2. **Variables** tab → **New repository variable**:
   - **Name:** `VITE_API_URL`
   - **Value:** `https://YOUR-RENDER-APP.onrender.com/api`  
     (your real Render URL + `/api`, no trailing slash)
3. Save.

---

## 4. Enable GitHub Pages

1. GitHub repo → **Settings** → **Pages**.
2. Under **Build and deployment**:
   - **Source:** **GitHub Actions**.
3. Save.

---

## 5. Deploy

- **Automatic:** Push to `main` (e.g. `git push origin main`). The workflow builds the frontend and deploys to GitHub Pages.
- **Manual:** **Actions** tab → **Deploy to GitHub Pages** → **Run workflow**.

After the workflow finishes, the site is at:

**`https://YOUR_USERNAME.github.io/YOUR_REPO_NAME/`**

Example: `https://jane.github.io/valorant-scout/`

---

## 6. CORS (backend must allow your Pages URL)

Render (or wherever the backend runs) must allow your GitHub Pages origin:

1. Render → your backend service → **Environment**.
2. Set **CORS_ORIGINS** to your Pages URL, e.g.  
   `https://YOUR_USERNAME.github.io`
   - No trailing slash.
   - If you use a custom domain for Pages, use that instead.

Save so the backend redeploys with the new CORS.

---

## 7. Base path (already configured)

The workflow sets **VITE_BASE_PATH** to `/${{ github.event.repository.name }}/` so assets and routing work on GitHub Pages (e.g. `/valorant-scout/`). You don’t need to change anything unless you use a custom domain or a user/org site.

---

## Checklist

- [ ] Backend deployed on Render (or similar) and URL copied.
- [ ] Repo variable **VITE_API_URL** = `https://YOUR-BACKEND.onrender.com/api`.
- [ ] Pages source set to **GitHub Actions**.
- [ ] Backend **CORS_ORIGINS** includes `https://YOUR_USERNAME.github.io`.
- [ ] Push to `main` (or run the workflow manually).

---

## If the site is blank or 404

- Confirm the workflow run succeeded (Actions tab).
- Open the **live URL** (with the repo path), e.g. `https://user.github.io/valorant-scout/`, not `https://user.github.io/`.
- Hard refresh (Ctrl+Shift+R) or try in an incognito window.

---

## Summary

| What        | Where        | URL |
|------------|--------------|-----|
| Frontend   | GitHub Pages | `https://USERNAME.github.io/REPO_NAME/` |
| Backend    | Render       | `https://your-app.onrender.com` |
| API calls  | From frontend to Render | Set **VITE_API_URL** in GitHub variables |
