# Which .env file do we use?

## Short answer

- **Backend:** Uses **one** file — **repo root `.env`** (the `.env` next to `backend/` and `frontend/`).
- **Frontend:** No `.env` needed for local dev (it uses `/api`). For production (e.g. GitHub Pages), set `VITE_API_URL` in your host (e.g. GitHub → Settings → Actions → Variables).

## Details

| App     | Local dev                         | Production                          |
|--------|------------------------------------|-------------------------------------|
| Backend | Reads **repo root `.env`** only   | Uses host env (e.g. Render dashboard) |
| Frontend | No `.env`; API base = `/api`      | `VITE_API_URL` set at build time (e.g. GitHub Actions variable) |

## What to do

1. **Keep a single `.env` at the repo root** (copy from `env.example`, fill in keys).
2. **Ignore or remove `backend/.env`** — the app no longer reads it. You can delete it to avoid confusion, or leave it; it won’t be used.
3. **Do not commit `.env`** — it’s in `.gitignore`; keep secrets only in repo root `.env` (and in your host’s env for production).

## Reference

- Backend config: `backend/app/config.py` → `env_file="../.env"` (repo root).
- Example file: `env.example` at repo root.
