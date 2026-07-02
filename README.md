# F1 Insight AI

**Intelligent Formula One Analytics & Performance Platform**

A premium, dark-first F1 analytics platform: live championship dashboard, driver /
constructor / circuit analytics, head-to-head comparisons, ML race predictions,
strategy simulation and a prediction league — powered by real historical data.

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

# 3. Frontend
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

## Project status

- ✅ **Phase 1** — data pipeline, dashboard (standings, next GP, championship chart, trending stats, latest race)
- 🚧 **Phase 2** — driver / constructor / circuit analytics pages, world map, comparisons
- 🚧 **Phase 3** — ML race predictor, strategy simulator, weather & tire analytics
- 🚧 **Phase 4** — auth, prediction league, AI assistant, polish

## Credits

Racing data © respective owners via the Jolpica-F1 community API and FastF1.
This is an unofficial analytics project, unaffiliated with Formula 1 companies.
