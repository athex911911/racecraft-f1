"""Tyre analytics from the FastF1 ingest (tyre_stints).

Clean signals: compound usage share and average stint length (durability).
Plus a fuel-corrected degradation estimate — within a stint tyre age and lap
number are collinear, so the raw lap-time slope folds in fuel burn-off; adding
a fixed fuel-burn term back isolates the tyre component. Honest estimate, not a
telemetry deg curve.
"""

from __future__ import annotations

from statistics import median

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.f1 import Circuit, Race, TyreStint
from app.schemas.f1 import CircuitTyresOut, CompoundUsage, TyreOverviewOut

# a lap of fuel is worth ~0.055s; adding it back turns the net stint slope into
# a tyre-only degradation estimate
FUEL_CORRECTION = 0.055
SLICKS = ("SOFT", "MEDIUM", "HARD")
COMPOUND_COLOR = {
    "SOFT": "#FF2D2D",
    "MEDIUM": "#FFD11A",
    "HARD": "#E6E6E6",
    "INTERMEDIATE": "#39B54A",
    "WET": "#00AEEF",
}
ORDER = {"SOFT": 0, "MEDIUM": 1, "HARD": 2, "INTERMEDIATE": 3, "WET": 4}


def _usage(rows: list[tuple]) -> list[CompoundUsage]:
    """rows: (compound, laps, avg_lap_s, deg_s_per_lap). Aggregates by compound."""
    by: dict[str, dict] = {}
    for compound, laps, avg_lap_s, deg in rows:
        if not compound:
            continue
        b = by.setdefault(compound, {"stints": 0, "laps": 0, "lens": [], "pace": [], "deg": []})
        b["stints"] += 1
        b["laps"] += laps or 0
        if laps:
            b["lens"].append(laps)
        if avg_lap_s is not None:
            b["pace"].append(avg_lap_s)
        if deg is not None:
            b["deg"].append(deg)

    total_laps = sum(b["laps"] for b in by.values()) or 1
    out: list[CompoundUsage] = []
    for compound, b in by.items():
        is_slick = compound in SLICKS
        deg_val = None
        if is_slick and b["deg"]:
            deg_val = round(max(0.0, median(b["deg"]) + FUEL_CORRECTION), 3)
        out.append(
            CompoundUsage(
                compound=compound.title(),
                color=COMPOUND_COLOR.get(compound, "#8a8a8a"),
                stints=b["stints"],
                laps=b["laps"],
                share=round(b["laps"] / total_laps, 3),
                avg_stint_laps=round(sum(b["lens"]) / len(b["lens"]), 1) if b["lens"] else 0.0,
                avg_pace_s=round(median(b["pace"]), 2) if b["pace"] else None,
                deg_s_per_lap=deg_val,
            )
        )
    out.sort(key=lambda c: ORDER.get(c.compound.upper(), 9))
    return out


def circuit_tyres(db: Session, circuit_ref: str) -> CircuitTyresOut | None:
    circuit = db.execute(
        select(Circuit).where(Circuit.circuit_ref == circuit_ref)
    ).scalar_one_or_none()
    if circuit is None:
        return None
    rows = db.execute(
        select(TyreStint.compound, TyreStint.laps, TyreStint.avg_lap_s, TyreStint.deg_s_per_lap)
        .join(Race, Race.id == TyreStint.race_id)
        .where(Race.circuit_id == circuit.id)
    ).all()
    races = db.execute(
        select(func.count(func.distinct(TyreStint.race_id)))
        .join(Race, Race.id == TyreStint.race_id)
        .where(Race.circuit_id == circuit.id)
    ).scalar()
    return CircuitTyresOut(
        circuit_ref=circuit_ref,
        races_with_data=races or 0,
        compounds=_usage(rows),
    )


def tyre_overview(db: Session, since: int = 2022) -> TyreOverviewOut:
    rows = db.execute(
        select(TyreStint.compound, TyreStint.laps, TyreStint.avg_lap_s, TyreStint.deg_s_per_lap)
        .join(Race, Race.id == TyreStint.race_id)
        .where(Race.season >= since)
    ).all()
    races = db.execute(
        select(func.count(func.distinct(TyreStint.race_id)))
        .join(Race, Race.id == TyreStint.race_id)
        .where(Race.season >= since)
    ).scalar()
    return TyreOverviewOut(races_with_data=races or 0, compounds=_usage(rows))
