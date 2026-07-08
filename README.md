# Racecraft

**Formula One analytics, from real data.**

Racecraft is a Formula One analytics platform I built to pull the sport's data into one place. F1 information tends to be scattered — standings on one site, history on another, schedules somewhere else — so Racecraft combines standings, driver and team analysis, race predictions, strategy simulation, a prediction league, and a natural-language assistant into a single application.

It covers the 2014–2026 seasons and serves everything from its own PostgreSQL database, so it never depends on a live third-party API at request time.

---

## Features

### Dashboard
The current-season overview: driver and constructor standings, the championship leaders, season progress, a countdown to the next Grand Prix, the latest race summary, and trending form — presented with interactive charts.

### Driver, constructor and circuit analytics
- **Drivers** — career statistics, wins, podiums, poles, fastest laps, recent form, and ratings computed from actual results.
- **Constructors** — team history, championship records, driver line-ups, and season-by-season performance trends.
- **Circuits** — interactive track maps on satellite imagery with derived racing lines, a modelled performance heatmap, lap records, DRS zones, historical winners, weather analysis, and track-suitability ratings for the current grid.

### Head-to-head comparison
Compare any two drivers side by side with radar charts and direct head-to-head statistics.

### Race predictor
XGBoost models estimate win, podium, and points-finish probabilities and produce an expected finishing order for a chosen Grand Prix. A Monte Carlo simulation projects championship title odds across the rest of the season. Prediction quality is benchmarked honestly against a pole-position baseline rather than being overstated.

### Strategy simulator
Models one, two, and three-stop race strategies from tyre wear, fuel burn-off, and per-circuit pit loss, and returns the optimal plan with a full lap-time breakdown. Wear severity is adjustable (low / normal / high).

### Prediction league
Predict the pole, winner, podium, and fastest lap for upcoming races. Entries are scored automatically once each race finishes, with a points breakdown and a leaderboard. Includes user accounts and saved favorite drivers, teams, and circuits.

### Natural-language assistant
Ask questions in plain English — for example, "Verstappen at Monza" or "compare Hamilton and Leclerc". The assistant resolves drivers, teams, and circuits and answers from the database, so every response is reproducible.

### Additional
A full race calendar with weekend schedules, weather and conditions insights (wet vs. dry performance, circuit suitability, temperature trends), and a range of data visualizations covering championship progression, performance trends, and historical comparisons.

---

## Design

The interface takes cues from modern Formula One broadcast and editorial design: a dark graphite theme, condensed display typography, large photography, and restrained motion. It is responsive across desktop and mobile.

---

## Tech stack

**Frontend** — Next.js, React, TypeScript, Tailwind CSS, Framer Motion, Recharts, Leaflet
**Backend** — FastAPI, SQLAlchemy, PostgreSQL
**Machine learning** — scikit-learn, XGBoost, pandas, NumPy
**Data** — Jolpica-F1 (the Ergast successor) and FastF1

Data is ingested into PostgreSQL and the API reads directly from it; the ML models are trained offline and committed as artifacts.

---

## Getting started

Requirements: Python 3.11+, Node 20+, and PostgreSQL 16 with a database named `f1_insight`.

Backend and data:

```powershell
cd backend
python -m venv .venv
.venv\Scripts\pip install -r requirements.txt
copy .env.example .env

# Ingest data (resumable — safe to stop and rerun)
cd ..
backend\.venv\Scripts\python pipeline\ingest\ingest.py --from-season 2024 --to-season 2026 --current-season-standings
backend\.venv\Scripts\python pipeline\ingest\seed.py
backend\.venv\Scripts\python pipeline\ingest\photos.py   # driver photos (optional)

# Create the accounts and prediction-league tables, then start the API
cd backend
.venv\Scripts\python -m app.init_db
.venv\Scripts\python -m app.seed_league      # optional demo accounts and past picks
.venv\Scripts\python -m uvicorn app.main:app --port 8000
```

Frontend, in a separate terminal:

```powershell
cd frontend
npm install
npm run dev
```

The app runs at `http://localhost:3000` and the API documentation at `http://localhost:8000/docs`.

To backfill older seasons (down to 1950), use `--slow` to respect the data source's rate limit:

```powershell
backend\.venv\Scripts\python pipeline\ingest\ingest.py --from-season 1950 --to-season 2023 --slow
```

Hosting instructions (Vercel, Render, and a managed Postgres) are in [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md).

---

## Testing

```powershell
cd backend
.venv\Scripts\python -m pytest
```

The suite covers authentication, prediction-league scoring, assistant intent matching, and API round-trips. It runs against the `f1_insight` database and cleans up any test data it creates.

---

## Roadmap

Planned additions:

- AI-generated race and driver summaries
- Pit-stop performance analytics (pending pit-stop timing data)
- Constructor-vs-constructor comparison
- Deeper reliability analysis and circuit storytelling

---

## Data and acknowledgements

Data comes from the [Jolpica-F1](https://github.com/jolpica/jolpica-f1) community API (the Ergast successor) and [FastF1](https://github.com/theOehrly/Fast-F1). Thanks to both projects and the wider Formula One community for making motorsport data accessible.

Built for educational and portfolio purposes.

## Author

Sanskar (athex)

## Disclaimer

This is an unofficial project and is not affiliated with Formula 1, the FIA, or any team.
