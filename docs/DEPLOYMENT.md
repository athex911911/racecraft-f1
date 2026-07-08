# Deploying Racecraft

Racecraft is three independent pieces, each hosted separately:

| Piece | Tech | Suggested host | Free tier? |
|---|---|---|---|
| Frontend | Next.js | **Vercel** | Yes |
| Backend API | FastAPI (Docker) | **Render** / Railway / Fly.io | Yes\* |
| Database | PostgreSQL 16 | **Neon** / Supabase | Yes |

\* Free backend tiers sleep when idle; the first request after a while takes ~30–60s.

Auth uses a bearer token in `localStorage` (no cross-site cookies), so the only
cross-origin concern is **CORS**. Everything talks over HTTPS.

> First-time deploy: ~30–45 minutes.

---

## 0. Prerequisites
- Code pushed to a **GitHub** repo (Vercel/Render deploy from GitHub).
- A local PostgreSQL client (`pg_dump` / `pg_restore`) — ships with PostgreSQL 16;
  on Windows it's in `C:\Program Files\PostgreSQL\16\bin`.
- Accounts on your chosen hosts.

## 1. Push to GitHub
```bash
git remote add origin https://github.com/<you>/racecraft.git
git push -u origin main
```
`.env`, `.env.local`, `.venv/`, `.next/` and `.fastf1cache/` are gitignored — secrets
and large caches stay out of the repo.

## 2. Create the managed database
Using **Neon** (neon.tech) as the example:
1. Create a project. It gives a connection string like:
   `postgresql://user:pass@ep-xxx.aws.neon.tech/neondb?sslmode=require`
2. You'll use it in **two forms**:
   - **For `pg_restore` (step 3):** exactly as given — `postgresql://…`.
   - **For the backend app (`DATABASE_URL`):** change the scheme to
     `postgresql+psycopg://…` (SQLAlchemy needs the driver name). Keep `?sslmode=require`.

Supabase works the same way — grab its connection string.

## 3. Copy your data into it
The cloud DB starts **empty**; your 2014–2026 data lives only in your local
`f1_insight`. Dump locally, restore to the cloud:

```bash
# export the local database to a file
pg_dump --no-owner --no-privileges -Fc \
  "postgresql://f1app:f1app_dev_password@localhost:5432/f1_insight" \
  -f racecraft.dump

# restore into the cloud database (plain postgresql:// scheme here)
pg_restore --no-owner --no-privileges --no-comments \
  -d "postgresql://user:pass@ep-xxx.aws.neon.tech/neondb?sslmode=require" \
  racecraft.dump
```
- `--no-owner --no-privileges` — the cloud user isn't `f1app`, so don't reassign ownership.
- This brings **everything**: all F1 data, the auth/league tables, and the demo
  league accounts (athex + synthetic users). Fine for a portfolio — the leaderboard
  is populated. To start clean instead, run `python -m app.init_db` against the cloud
  DB and re-ingest rather than restoring.

Sanity check:
```bash
psql "postgresql://user:pass@ep-xxx.aws.neon.tech/neondb?sslmode=require" \
  -c "select count(*) from drivers;"
```

## 4. Deploy the backend (Render, Docker)
The repo ships `backend/Dockerfile`, `backend/.dockerignore`, and an optional
`render.yaml` blueprint.

1. Render → **New → Web Service** → connect the repo.
2. Settings:
   - **Root Directory:** `backend`
   - **Runtime:** Docker (auto-detects `backend/Dockerfile`)
   - **Health Check Path:** `/api/health`
3. **Environment variables:**

   | Key | Value |
   |---|---|
   | `DATABASE_URL` | `postgresql+psycopg://user:pass@ep-xxx…/neondb?sslmode=require` |
   | `JWT_SECRET` | long random string — `python -c "import secrets; print(secrets.token_urlsafe(48))"` |
   | `CORS_ORIGINS` | your Vercel URL (fill in after step 5) |
   | `DEBUG` | `false` |

4. Deploy. You'll get e.g. `https://racecraft-api.onrender.com`; confirm
   `…/api/health` returns `{"status":"ok"}`.

The container binds `0.0.0.0:$PORT` automatically (Render/Railway/Fly all inject `$PORT`).

> Shortcut: Render → **New → Blueprint** → point at `render.yaml`. It pre-defines the
> service and auto-generates `JWT_SECRET`; you still paste `DATABASE_URL` and `CORS_ORIGINS`.

## 5. Deploy the frontend (Vercel)
1. Vercel → **New Project** → import the repo.
2. **Root Directory:** `frontend` (Next.js auto-detected; leave build/output default).
3. **Environment variable:**

   | Key | Value |
   |---|---|
   | `NEXT_PUBLIC_API_URL` | backend base URL, e.g. `https://racecraft-api.onrender.com` (no trailing slash, no `/api`) |

4. Deploy → you get e.g. `https://racecraft.vercel.app`.

> `NEXT_PUBLIC_*` values are baked in at **build time**. If you change one later, redeploy.

## 6. Connect them (CORS)
Back on the backend host, set `CORS_ORIGINS` to your Vercel URL and redeploy:
```
CORS_ORIGINS=https://racecraft.vercel.app
```
Add more comma-separated entries for a custom domain:
```
CORS_ORIGINS=https://racecraft.vercel.app,https://www.racecraft.app
```

## 7. Verify
- Open the Vercel URL — the dashboard loading standings proves frontend → backend → DB.
- Log in (`athex` / `racecar2026` if you restored the demo data) — proves auth + JWT.
- **Site loads but no data?** Almost always CORS. Open the browser console, look for
  "blocked by CORS policy", and make sure `CORS_ORIGINS` matches the frontend origin
  exactly (scheme + host, no trailing slash).

---

## Common gotchas
- **DB scheme:** the app's `DATABASE_URL` uses `postgresql+psycopg://…`; `pg_dump` /
  `pg_restore` / `psql` use plain `postgresql://…`.
- **SSL:** keep `?sslmode=require` on managed Postgres.
- **Cold starts:** free backend tiers sleep; the first request is slow. Upgrade the
  plan or ping the health URL periodically to keep it warm.
- **No retraining needed to deploy:** ML artifacts are committed and data is in the
  DB. Retrain/re-ingest locally and re-dump if you add seasons.
- **`.env` never commits** — set every secret in the host dashboard.

## Updating after deploy
Vercel and Render both redeploy automatically on `git push` to `main`. For DB schema
changes, run `python -m app.init_db` against the cloud DB (additive) or dump/restore again.
