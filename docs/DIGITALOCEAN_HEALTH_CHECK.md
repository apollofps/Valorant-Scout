# Fix "connection refused" on port 8000 — DigitalOcean App Platform

Your app listens on **8080** but the health check was probing **8000**. Fix it by setting the port in the **App Spec**.

---

## Where to set it (you can't find "Health Check" in the UI)

The port is controlled by the **App Spec** (YAML), not a separate "Health Check" form in some DO UIs.

### Option 1: Edit App Spec in the dashboard

1. Go to [cloud.digitalocean.com/apps](https://cloud.digitalocean.com/apps) → click your app.
2. Open the **App Spec** tab (or **Resources** → your Web Service component → look for **Edit** or **Spec**).
3. If you see an **Edit** or **Edit your app spec** / **View app spec** button, click it to open the YAML editor.
4. Find the `services:` section and your backend service (the one with `run_command` and `source_dir: backend` or similar). Add or update:

   **A. Set the component’s HTTP port (so DO uses 8080 and injects PORT=8080):**
   ```yaml
   services:
     - name: your-backend-service-name   # keep your existing name
       http_port: 8080
       # ... rest of your config (source_dir, run_command, envs, etc.)
   ```

   **B. Optional: set the health check port explicitly (if it still probes 8000):**
   ```yaml
   services:
     - name: your-backend-service-name
       http_port: 8080
       health_check:
         port: 8080
         http_path: /health
         initial_delay_seconds: 30
         period_seconds: 10
         timeout_seconds: 5
       # ... rest (run_command, envs, etc.)
   ```

5. Save / **Update** the spec and redeploy.

---

### Option 2: If your UI has "Settings" on the component

1. Apps → your app → **Resources**.
2. Click your **Web Service** (the backend component).
3. Look for **Settings**, **General**, or **Health Check**.
4. If you see **HTTP Port** or **Port**, set it to **8080**.
5. If you see **Health Check** with a **Port** field, set it to **8080**.
6. Save and redeploy.

---

### Option 3: Use a spec file in the repo (`.do/app.yaml`)

If your app is created "from repo" and DO reads the spec from the repo:

1. Create `.do/app.yaml` in the repo root (see [FULL_DEPLOYMENT_GUIDE.md](../FULL_DEPLOYMENT_GUIDE.md) section 10 for a full example).
2. Under your service, set `http_port: 8080` and `health_check.port: 8080`.
3. Push and let DO redeploy.

---

## Summary

- **App listens on:** 8080 (your Run Command uses `--port ${PORT:-8080}`).
- **DO must probe:** 8080.
- Set **http_port: 8080** (and optionally **health_check.port: 8080**) in the App Spec so the health check uses 8080 and the deployment succeeds.

---

## If the app keeps crashing / restarting (OOM)

The default instance is often **basic-xxs** (512 MB RAM), which can be too small for report generation + LLM. Increase the instance size.

### Where to change it

1. **App Spec:** In the same YAML, under your backend service, set **instance_size_slug**:
   ```yaml
   services:
     - name: your-backend-service-name
       http_port: 8080
       instance_size_slug: basic-xs   # 1 GB RAM (or basic-s for 2 GB)
       # ... rest (source_dir, run_command, envs, etc.)
   ```
2. **Dashboard:** Apps → your app → **Resources** → click your **Web Service** → look for **Instance size**, **Plan**, or **Scale** → choose a larger size.
3. Save and redeploy.

### Instance size options (Basic — shared CPU)

| Slug        | RAM   | vCPU | Use when              |
|------------|-------|------|------------------------|
| basic-xxs  | 512 MB | 1   | Default; often OOM    |
| basic-xs   | 1 GB   | 1   | **Recommended minimum** for this app |
| basic-s    | 2 GB   | 1   | Heavier report usage  |
| basic-m    | 4 GB   | 2   | Many concurrent users  |

Start with **basic-xs** (1 GB). If it still crashes under load, move to **basic-s** (2 GB). Your $200 credit will cover these for a long time.
