# Racecraft

**Formula One Analytics**

A premium, dark-first F1 analytics platform: live championship dashboard, driver /
constructor / circuit analytics, head-to-head comparisons, ML race predictions,
strategy simulation, a prediction league and a natural-language assistant —
powered by real historical data.

![stack](https://img.shields.io/badge/Next.js%2016-black) ![stack](https://img.shields.io/badge/FastAPI-009688) ![stack](https://img.shields.io/badge/PostgreSQL%2016-336791) ![stack](https://img.shields.io/badge/scikit--learn%20%2B%20XGBoost-orange)

## Architecture

```
frontend/   Next.js 16 (App Router) · TypeScript · Tailwind v4 · Recharts · Framer Motion
backend/    FastAPI · SQLAlchemy 2.0 · PostgreSQL 16 · in-process caching
pipeline/   Jolpica-F1 + FastF1 ingestion · curated seeds · ML training (XGBoost)
```

Data sources: [Jolpica-F1](https://github.com/jolpica/jolpica-f1) (Ergast successor,
seasons 1950→present) bulk-ingested into PostgreSQL, plus
[FastF1](https://github.com/theOehrly/Fast-F1) for lap-level detail. The app never
depends on live third-party APIs at request time.

## Getting started

Prereqs: Python 3.11+, Node 20+, PostgreSQL 16 with a `f1_insight` database.

```powershell
# 1. Backend
cd backend
python -m venv .venv
.venv\Scripts\pip install -r requirements.txt
copy .env.example .env
.venv\Scripts\python -m uvicorn app.main:app --port 8000

# 2. Ingest data (resumable; rerun any time)
cd ..
backend\.venv\Scripts\python pipeline\ingest\ingest.py --from-season 2024 --to-season 2026 --current-season-standings
backend\.venv\Scripts\python pipeline\ingest\seed.py
backend\.venv\Scripts\python pipeline\ingest\photos.py   # driver headshots from Wikipedia (optional)

# 3. Create the auth + prediction-league tables, then optionally seed demo league data
cd backend
.venv\Scripts\python -m app.init_db
.venv\Scripts\python -m app.seed_league      # demo accounts + historical picks (optional)
cd ..

# 4. Frontend
cd frontend
npm install
npm run dev   # http://localhost:3000
```

API docs at `http://localhost:8000/docs`.

### Backfilling more history

```powershell
backend\.venv\Scripts\python pipeline\ingest\ingest.py --from-season 1950 --to-season 2023 --slow
```

`--slow` paces requests to Jolpica's 500 req/hr sustained cap. The ingester
checkpoints per (entity, season) so it can be stopped and resumed freely.

## Testing

Backend (auth, league scoring, assistant intents, API round-trips):

```powershell
cd backend
.venv\Scripts\python -m pytest
```

Tests run against the `f1_insight` database and clean up anything they create
(throwaway `pytest_*` accounts). The frontend is gated by `npm run build`, which
runs TypeScript + lint and must pass with zero errors.

## Project status

- ✅ **Phase 1** — data pipeline, dashboard (standings, next GP, championship chart, trending stats, latest race)
- ✅ **Phase 2** — driver / constructor / circuit analytics (real photos, computed ratings, records); interactive world map (Leaflet); driver-vs-driver head-to-head; race calendar; history explorer with full results
- ✅ **Phase 3** — ML race predictor + championship Monte Carlo; strategy simulator; performance heatmap & racing lines on satellite imagery; track suitability; weather & tyre analytics (FastF1)
- ✅ **Phase 4** — accounts & profiles (JWT auth, saved favorites); Prediction League (pick pole / podium / fastest lap, deterministic scoring, leaderboard); template-based AI assistant (natural-language Q&A over the database, no external LLM); _tests & deployment in progress_

### The AI assistant

The assistant answers from the database only — no external LLM, so every answer is
reproducible. It resolves driver / team / circuit mentions and handles intents like
career profiles, two-driver head-to-heads, championship standings, "X at \<circuit\>"
records and the next race. The provider sits behind a pluggable interface
(`backend/app/insights/`), so a Claude-backed provider could be dropped in later
without touching the API.

## Credits

Racing data © respective owners via the Jolpica-F1 community API and FastF1.
This is an unofficial analytics project, unaffiliated with Formula 1 companies.
