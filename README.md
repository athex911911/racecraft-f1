# Racecraft

Formula One analytics on real data: championship dashboard, driver/team/circuit
pages, head-to-head comparisons, race predictions, pit-strategy simulation, a
prediction game, and a plain-English assistant.

I follow F1 and got tired of hunting for stats across a dozen tabs, so I built a
place to actually dig into the numbers. It covers the 2014–2026 seasons and runs
off data I've pulled into my own Postgres database, so clicking around never waits
on some third-party API.

## What's in it

- **Dashboard** — the live title race, the next Grand Prix, current form and who's
  leading both championships.
- **Drivers, teams, circuits** — a page each, with career numbers, records, photos,
  and ratings computed from actual results.
- **Compare** — put two drivers side by side (the radar-chart, head-to-head kind).
- **Predictor** — XGBoost models for win / podium / points, plus a Monte Carlo run
  for the title fight. Being honest: guessing race winners in the current era is
  hard, and the model only barely beats a "back whoever's on pole" baseline. The app
  shows that comparison instead of pretending otherwise.
- **Strategy** — figures out one, two, or three-stop plans from tyre wear, fuel
  burn-off and pit loss, tuned per circuit.
- **Maps & heatmaps** — real track shapes on satellite imagery, coloured by modelled
  corner speed. It's a model, not telemetry, and the page says so.
- **Prediction league** — call the pole, podium and fastest lap for upcoming races,
  get scored automatically once they finish, and climb a leaderboard.
- **Assistant** — ask things like "Verstappen at Monza" or "compare Hamilton and
  Leclerc". It's a rule-based matcher over the database, not an LLM wrapper, so the
  answers are reproducible and it costs nothing to run.

## How it's built

- **Frontend:** Next.js 16 (App Router), TypeScript, Tailwind, Recharts for charts,
  Leaflet for the maps, Framer Motion for the motion.
- **Backend:** FastAPI and SQLAlchemy on PostgreSQL 16, with light in-process caching.
- **Data & ML:** an ingestion pipeline that reads from Jolpica (the Ergast successor)
  and FastF1, and XGBoost models trained offline and committed as artifacts.

The API reads straight from Postgres. Nothing hits a live external API on the request path.

## Running it locally

You'll need Python 3.11+, Node 20+, and PostgreSQL 16 with a database named `f1_insight`.

Backend and data:

```powershell
cd backend
python -m venv .venv
.venv\Scripts\pip install -r requirements.txt
copy .env.example .env

# pull some data in — this is resumable, so you can stop and rerun it
cd ..
backend\.venv\Scripts\python pipeline\ingest\ingest.py --from-season 2024 --to-season 2026 --current-season-standings
backend\.venv\Scripts\python pipeline\ingest\seed.py
backend\.venv\Scripts\python pipeline\ingest\photos.py   # driver photos, optional

# create the accounts + league tables (with optional demo data), then start the API
cd backend
.venv\Scripts\python -m app.init_db
.venv\Scripts\python -m app.seed_league      # optional: demo accounts + past picks
.venv\Scripts\python -m uvicorn app.main:app --port 8000
```

Frontend, in another terminal:

```powershell
cd frontend
npm install
npm run dev
```

Open http://localhost:3000. The API docs live at http://localhost:8000/docs.

Want deeper history? The ingester goes all the way back to 1950. Use `--slow` so you
don't trip Jolpica's rate limit:

```powershell
backend\.venv\Scripts\python pipeline\ingest\ingest.py --from-season 1950 --to-season 2023 --slow
```

Backend tests:

```powershell
cd backend
.venv\Scripts\python -m pytest
```

If you ever want to host it somewhere, there's a full walkthrough in `docs/DEPLOYMENT.md`.

## Honest caveats

- The predictor's accuracy is modest, and I report it straight — the pole-position
  baseline is genuinely hard to beat in this era of the sport.
- Tyre degradation and pit losses in the strategy sim are calibrated estimates, not
  measured telemetry.
- Pit-stop timing data isn't loaded, and seasons before 2014 aren't ingested by default.
- Driver photos come from Wikipedia and fall back to initials when one's missing.

## Credits

Data comes from the [Jolpica-F1](https://github.com/jolpica/jolpica-f1) community API
(the Ergast successor) and [FastF1](https://github.com/theOehrly/Fast-F1). Thanks to
both projects. This is an unofficial personal project and isn't affiliated with
Formula 1 or any team.

Built by athex.
