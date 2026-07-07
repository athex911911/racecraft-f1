"""FastF1 ingest: per-race weather summary + tyre stints (2018+ race sessions).

Stores compact aggregates (not raw laps): one `race_weather` row per race and
one `tyre_stints` row per driver-stint, with a fitted degradation slope for
slick stints. Powers weather-impact and tyre analytics, and lets the strategy
simulator calibrate against real degradation.

Resumable: races that already have a `race_weather` row are skipped. Loads only
laps + weather (telemetry skipped) so each race is ~10-15s cold.

    backend/.venv/Scripts/python pipeline/ingest/fastf1_ingest.py --from-season 2019 --to-season 2026
"""

from __future__ import annotations

import argparse
import logging
import sys
import warnings
from pathlib import Path

warnings.filterwarnings("ignore")

REPO_ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(REPO_ROOT / "backend"))

import numpy as np  # noqa: E402
import fastf1  # noqa: E402
from sqlalchemy import delete, select  # noqa: E402
from sqlalchemy.orm import Session  # noqa: E402

from app.core.database import Base, SessionLocal, engine  # noqa: E402
from app.models.f1 import Driver, Race, RaceWeather, Result, TyreStint  # noqa: E402

logging.basicConfig(level=logging.INFO, format="%(message)s")
log = logging.getLogger("fastf1_ingest")
fastf1.set_log_level("ERROR")

CACHE_DIR = REPO_ROOT / ".fastf1cache"
SLICKS = {"SOFT", "MEDIUM", "HARD"}
WETS = {"INTERMEDIATE", "WET"}


def _fit_deg(clean_sec: np.ndarray, life: np.ndarray) -> tuple[float | None, float | None]:
    """Median pace + degradation slope (s/lap) from a stint's clean laps."""
    if len(clean_sec) < 6:
        return None, None
    med = float(np.median(clean_sec))
    keep = clean_sec < med + 3.0  # drop traffic / out-laps / mistakes
    sec, lif = clean_sec[keep], life[keep]
    if len(sec) < 6 or lif.max() <= lif.min():
        return round(float(np.median(sec)), 3), None
    slope = float(np.polyfit(lif, sec, 1)[0])
    return round(float(np.median(sec)), 3), round(max(-0.20, min(0.45, slope)), 4)


def ingest_race(db: Session, race: Race) -> str:
    ses = fastf1.get_session(race.season, race.round, "R")
    ses.load(laps=True, weather=True, telemetry=False, messages=False)
    laps = ses.laps
    if laps is None or len(laps) == 0:
        return "no laps"

    # FastF1 driver abbreviation -> our driver_id (only drivers in this race)
    code_map: dict[str, int] = {}
    for did, code in db.execute(
        select(Result.driver_id, Driver.code)
        .join(Driver, Driver.id == Result.driver_id)
        .where(Result.race_id == race.id)
    ).all():
        if code:
            code_map[code] = did

    w = ses.weather_data
    have_w = w is not None and len(w) > 0
    total = len(laps)
    wet_laps = int(laps["Compound"].isin(WETS).sum())

    db.execute(delete(TyreStint).where(TyreStint.race_id == race.id))
    db.execute(delete(RaceWeather).where(RaceWeather.race_id == race.id))
    db.add(
        RaceWeather(
            race_id=race.id,
            air_temp=round(float(w["AirTemp"].mean()), 1) if have_w else None,
            track_temp=round(float(w["TrackTemp"].mean()), 1) if have_w else None,
            humidity=round(float(w["Humidity"].mean()), 1) if have_w else None,
            wind_speed=round(float(w["WindSpeed"].mean()), 1) if have_w else None,
            rainfall=bool(w["Rainfall"].any()) if have_w else False,
            wet_fraction=round(wet_laps / total, 3) if total else 0.0,
        )
    )

    n_stints = 0
    for abbr, dl in laps.groupby("Driver"):
        did = code_map.get(str(abbr))
        if not did:
            continue
        for stint_no, sl in dl.groupby("Stint"):
            if sl.empty:
                continue
            compound = str(sl["Compound"].iloc[0]) if sl["Compound"].notna().any() else None
            avg = deg = None
            if compound in SLICKS:
                clean = sl[(sl["IsAccurate"]) & sl["LapTime"].notna()]
                if len(clean) >= 6:
                    sec = clean["LapTime"].dt.total_seconds().to_numpy(dtype=float)
                    life = clean["TyreLife"].to_numpy(dtype=float)
                    avg, deg = _fit_deg(sec, life)
            db.add(
                TyreStint(
                    race_id=race.id,
                    driver_id=did,
                    stint=int(stint_no),
                    compound=compound,
                    start_lap=int(sl["LapNumber"].min()),
                    laps=int(len(sl)),
                    tyre_life_start=(
                        int(sl["TyreLife"].min()) if sl["TyreLife"].notna().any() else None
                    ),
                    avg_lap_s=avg,
                    deg_s_per_lap=deg,
                )
            )
            n_stints += 1

    db.commit()
    wetflag = " WET" if wet_laps else ""
    return f"ok — {n_stints} stints{wetflag}"


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--from-season", type=int, default=2019)
    ap.add_argument("--to-season", type=int, default=2026)
    args = ap.parse_args()

    CACHE_DIR.mkdir(exist_ok=True)
    fastf1.Cache.enable_cache(str(CACHE_DIR))
    Base.metadata.create_all(engine)

    db = SessionLocal()
    races = (
        db.execute(
            select(Race)
            .join(Result, Result.race_id == Race.id)
            .where(Race.season >= args.from_season, Race.season <= args.to_season)
            .distinct()
            .order_by(Race.season, Race.round)
        )
        .scalars()
        .all()
    )
    done = set(db.execute(select(RaceWeather.race_id)).scalars())
    todo = [r for r in races if r.id not in done]
    log.info("FastF1 ingest: %d races in range, %d already done, %d to do",
             len(races), len(races) - len(todo), len(todo))

    ok = fail = 0
    for i, race in enumerate(todo, 1):
        try:
            status = ingest_race(db, race)
            ok += 1
            log.info("[%d/%d] %s R%d %s: %s", i, len(todo), race.season, race.round, race.name, status)
        except Exception as exc:  # noqa: BLE001 — keep going on a bad session
            fail += 1
            db.rollback()
            log.warning("[%d/%d] %s R%d %s: FAILED — %s",
                        i, len(todo), race.season, race.round, race.name, exc)
    db.close()
    log.info("done — %d ingested, %d failed", ok, fail)


if __name__ == "__main__":
    main()
