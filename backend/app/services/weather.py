"""Weather impact analytics from the FastF1 ingest (race_weather).

Two views: a circuit's typical conditions, and grid-wide wet-weather ratings
(how much better/worse each current driver finishes in the wet vs their own
dry baseline — the delta controls for car pace).
"""

from __future__ import annotations

from collections import defaultdict
from statistics import mean

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.f1 import Circuit, Constructor, Driver, Race, RaceWeather, Result
from app.schemas.f1 import (
    CircuitConditionsOut,
    ConstructorOut,
    RaceConditionLine,
    WetRatingEntry,
    WetRatingsOut,
)
from app.services.dashboard import _driver_out

WET_THRESHOLD = 0.06  # >= 6% of race laps on intermediate/wet tyres = a "wet race"
MIN_WET_RACES = 2


def _is_wet(rainfall: bool, wet_fraction: float) -> bool:
    return wet_fraction >= WET_THRESHOLD or (rainfall and wet_fraction >= 0.02)


def circuit_conditions(db: Session, circuit_ref: str) -> CircuitConditionsOut | None:
    circuit = db.execute(
        select(Circuit).where(Circuit.circuit_ref == circuit_ref)
    ).scalar_one_or_none()
    if circuit is None:
        return None

    rows = db.execute(
        select(Race.season, Race.name, RaceWeather)
        .join(RaceWeather, RaceWeather.race_id == Race.id)
        .where(Race.circuit_id == circuit.id)
        .order_by(Race.date.desc())
    ).all()

    if not rows:
        return CircuitConditionsOut(
            circuit_ref=circuit_ref,
            races_with_data=0,
            avg_air_temp=None,
            avg_track_temp=None,
            wet_races=0,
            wet_rate=None,
            recent=[],
        )

    airs = [w.air_temp for _, _, w in rows if w.air_temp is not None]
    tracks = [w.track_temp for _, _, w in rows if w.track_temp is not None]
    wet = sum(1 for _, _, w in rows if _is_wet(w.rainfall, w.wet_fraction))
    recent = [
        RaceConditionLine(
            season=season,
            race_name=name,
            air_temp=w.air_temp,
            track_temp=w.track_temp,
            rainfall=w.rainfall,
            wet_fraction=w.wet_fraction,
        )
        for season, name, w in rows[:6]
    ]
    return CircuitConditionsOut(
        circuit_ref=circuit_ref,
        races_with_data=len(rows),
        avg_air_temp=round(mean(airs), 1) if airs else None,
        avg_track_temp=round(mean(tracks), 1) if tracks else None,
        wet_races=wet,
        wet_rate=round(wet / len(rows), 3),
        recent=recent,
    )


def wet_weather_ratings(db: Session) -> WetRatingsOut:
    # races we have weather for, split into wet / dry
    wx = db.execute(select(RaceWeather.race_id, RaceWeather.rainfall, RaceWeather.wet_fraction)).all()
    wet_ids = {rid for rid, rain, frac in wx if _is_wet(rain, frac)}
    weather_ids = {rid for rid, _, _ in wx}
    if not wet_ids:
        return WetRatingsOut(wet_race_count=0, entries=[])

    latest = db.execute(select(func.max(Race.season))).scalar()
    grid: dict[int, int] = {}
    for did, cid, _ in db.execute(
        select(Result.driver_id, Result.constructor_id, Race.date)
        .join(Race, Race.id == Result.race_id)
        .where(Race.season == latest)
        .order_by(Race.date)
    ).all():
        grid[did] = cid
    if not grid:
        return WetRatingsOut(wet_race_count=len(wet_ids), entries=[])

    # classified finishes only (position_text numeric) for grid drivers in weather races
    wet_fin: dict[int, list[int]] = defaultdict(list)
    dry_fin: dict[int, list[int]] = defaultdict(list)
    for did, pos, ptxt, rid in db.execute(
        select(Result.driver_id, Result.position, Result.position_text, Result.race_id).where(
            Result.driver_id.in_(list(grid)), Result.race_id.in_(list(weather_ids))
        )
    ).all():
        if pos is None or not (ptxt and ptxt.isdigit()):
            continue
        (wet_fin if rid in wet_ids else dry_fin)[did].append(pos)

    drivers = {d.id: d for d in db.execute(select(Driver).where(Driver.id.in_(list(grid)))).scalars()}
    cons = {
        c.id: c
        for c in db.execute(select(Constructor).where(Constructor.id.in_(set(grid.values())))).scalars()
    }

    entries: list[WetRatingEntry] = []
    for did in grid:
        wets = wet_fin.get(did, [])
        if len(wets) < MIN_WET_RACES or did not in drivers:
            continue
        drys = dry_fin.get(did, [])
        wet_avg = mean(wets)
        dry_avg = mean(drys) if drys else None
        delta = round((dry_avg - wet_avg), 2) if dry_avg is not None else 0.0
        entries.append(
            WetRatingEntry(
                driver=_driver_out(drivers[did]),
                constructor=(
                    ConstructorOut.model_validate(cons[grid[did]]) if grid[did] in cons else None
                ),
                wet_races=len(wets),
                wet_avg_finish=round(wet_avg, 2),
                dry_avg_finish=round(dry_avg, 2) if dry_avg is not None else None,
                delta=delta,
            )
        )

    # best wet performers first: gained the most vs their dry baseline
    entries.sort(key=lambda e: e.delta, reverse=True)
    return WetRatingsOut(wet_race_count=len(wet_ids), entries=entries)
