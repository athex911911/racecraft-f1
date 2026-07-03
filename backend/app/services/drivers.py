"""Query + analytics logic behind the driver endpoints.

All functions are pure reads. Ratings are real math derived from ingested
results (no fabricated numbers), normalised to a 0–100 scale against fixed
reference bands so a driver's card is meaningful on its own.
"""

from __future__ import annotations

import statistics

from sqlalchemy import and_, case, func, select
from sqlalchemy.orm import Session

from app.models.f1 import (
    Constructor,
    Driver,
    DriverStanding,
    QualifyingResult,
    Race,
    Result,
)
from app.schemas.f1 import (
    ConstructorOut,
    DriverCareerStats,
    DriverDetailOut,
    DriverListItem,
    DriverOut,
    DriverRating,
    DriverResultLine,
    DriverSeasonStat,
)
from app.services.dashboard import _driver_out, resolve_season


def _clamp(value: float, lo: float = 0.0, hi: float = 100.0) -> float:
    return max(lo, min(hi, value))


def _finish_pos(position_text: str | None) -> int | None:
    """Actual finishing position, or None for DNF/DSQ/DNS (non-numeric position_text).

    In Ergast/Jolpica data ``position`` always holds the classified order even for
    retirements; a real finish is signalled by a numeric ``position_text``.
    """
    return int(position_text) if position_text and position_text.isdigit() else None


# Postgres regex: position_text is a plain integer (a classified finish)
_NUMERIC_TEXT = Result.position_text.op("~")(r"^[0-9]+$")


def _pole_counts(db: Session, season: int | None, driver_ids: list[int] | None = None) -> dict[int, int]:
    q = (
        select(QualifyingResult.driver_id, func.count())
        .join(Race, QualifyingResult.race_id == Race.id)
        .where(QualifyingResult.position == 1)
        .group_by(QualifyingResult.driver_id)
    )
    if season is not None:
        q = q.where(Race.season == season)
    if driver_ids is not None:
        q = q.where(QualifyingResult.driver_id.in_(driver_ids))
    return dict(db.execute(q).all())


def _recent_constructor_all_time(db: Session, driver_ids: list[int]) -> dict[int, Constructor]:
    """Each driver's most recent constructor across all ingested seasons."""
    if not driver_ids:
        return {}
    rows = db.execute(
        select(Result.driver_id, Constructor)
        .join(Race, Result.race_id == Race.id)
        .join(Constructor, Result.constructor_id == Constructor.id)
        .where(Result.driver_id.in_(driver_ids))
        .order_by(Result.driver_id, Race.date.desc())
        .distinct(Result.driver_id)  # Postgres DISTINCT ON (driver_id)
    ).all()
    return {driver_id: constructor for driver_id, constructor in rows}


def _recent_constructor_in_season(db: Session, season: int) -> dict[int, Constructor]:
    rows = db.execute(
        select(Result.driver_id, Constructor)
        .join(Race, Result.race_id == Race.id)
        .join(Constructor, Result.constructor_id == Constructor.id)
        .where(Race.season == season)
        .order_by(Result.driver_id, Race.round.desc())
        .distinct(Result.driver_id)
    ).all()
    return {driver_id: constructor for driver_id, constructor in rows}


def driver_list(
    db: Session,
    season: str | int | None = "current",
    search: str | None = None,
    limit: int = 100,
) -> list[DriverListItem]:
    all_time = str(season).lower() == "all"
    resolved: int | None = None if all_time else resolve_season(db, season)

    agg = (
        select(
            Result.driver_id,
            func.count(func.distinct(Result.race_id)).label("races"),
            func.coalesce(func.sum(Result.points), 0.0).label("points"),
            func.sum(case((Result.position_text == "1", 1), else_=0)).label("wins"),
            func.sum(
                case((and_(_NUMERIC_TEXT, Result.position <= 3), 1), else_=0)
            ).label("podiums"),
            func.min(case((_NUMERIC_TEXT, Result.position), else_=None)).label("best_finish"),
        )
        .join(Race, Result.race_id == Race.id)
        .group_by(Result.driver_id)
    )
    if resolved is not None:
        agg = agg.where(Race.season == resolved)
    rows = db.execute(agg).all()
    if not rows:
        return []

    driver_ids = [r.driver_id for r in rows]
    drivers = {
        d.id: d
        for d in db.execute(select(Driver).where(Driver.id.in_(driver_ids))).scalars()
    }
    poles = _pole_counts(db, resolved, driver_ids)
    constructors = (
        _recent_constructor_in_season(db, resolved)
        if resolved is not None
        else _recent_constructor_all_time(db, driver_ids)
    )

    items: list[DriverListItem] = []
    for r in rows:
        driver = drivers.get(r.driver_id)
        if driver is None:
            continue
        if search and search.lower() not in f"{driver.forename} {driver.surname}".lower():
            continue
        constructor = constructors.get(r.driver_id)
        items.append(
            DriverListItem(
                driver=_driver_out(driver),
                constructor=ConstructorOut.model_validate(constructor) if constructor else None,
                season=resolved,
                races=r.races,
                wins=int(r.wins or 0),
                podiums=int(r.podiums or 0),
                poles=poles.get(r.driver_id, 0),
                points=float(r.points or 0.0),
                best_finish=r.best_finish,
            )
        )

    items.sort(key=lambda i: (i.points, i.wins, i.podiums), reverse=True)
    return items[:limit]


def _championship_positions(db: Session, driver_id: int) -> dict[int, int | None]:
    """Season -> final championship position (last standings row of the season)."""
    rows = db.execute(
        select(Race.season, DriverStanding.position)
        .join(Race, DriverStanding.race_id == Race.id)
        .where(DriverStanding.driver_id == driver_id)
        .order_by(Race.season, Race.round)
    ).all()
    positions: dict[int, int | None] = {}
    for season, position in rows:
        positions[season] = position  # later rounds overwrite -> final standing
    return positions


def _ratings(
    grids_finishes: list[tuple[int | None, int | None]],
    finishes: list[int],
    races: int,
    podiums: int,
    points: float,
    avg_quali: float | None,
) -> list[DriverRating]:
    ratings: list[DriverRating] = []

    # Qualifying pace — average grid slot (1 best, 20 worst)
    if avg_quali is not None:
        ratings.append(
            DriverRating(
                key="qualifying",
                label="Qualifying",
                value=round(_clamp(100 * (20 - avg_quali) / 19), 1),
                detail=f"Avg qualifying P{avg_quali:.1f}",
            )
        )

    # Racecraft — average places gained from grid to flag
    deltas = [g - p for g, p in grids_finishes if g and g > 0 and p is not None]
    if deltas:
        gained = statistics.fmean(deltas)
        ratings.append(
            DriverRating(
                key="racecraft",
                label="Racecraft",
                value=round(_clamp(100 * (gained + 2) / 6), 1),
                detail=f"{gained:+.1f} places/race",
            )
        )

    # Consistency — inverse spread of finishing positions
    if len(finishes) >= 2:
        spread = statistics.pstdev(finishes)
        ratings.append(
            DriverRating(
                key="consistency",
                label="Consistency",
                value=round(_clamp(100 * (1 - spread / 8)), 1),
                detail=f"σ {spread:.1f} finishing pos",
            )
        )

    # Reliability — share of races reaching classification
    if races:
        rate = len(finishes) / races
        ratings.append(
            DriverRating(
                key="reliability",
                label="Reliability",
                value=round(_clamp(100 * rate), 1),
                detail=f"{rate * 100:.0f}% races classified",
            )
        )

    # Podium threat
    if races:
        rate = podiums / races
        ratings.append(
            DriverRating(
                key="podiums",
                label="Podium Rate",
                value=round(_clamp(100 * rate / 0.5), 1),
                detail=f"{rate * 100:.0f}% podium rate",
            )
        )

    # Scoring — points per race against an elite ~15 ppr band
    if races:
        ppr = points / races
        ratings.append(
            DriverRating(
                key="scoring",
                label="Scoring",
                value=round(_clamp(100 * ppr / 15), 1),
                detail=f"{ppr:.1f} pts/race",
            )
        )

    return ratings


_STRENGTH_PHRASE = {
    "qualifying": "Elite one-lap qualifying pace",
    "racecraft": "Makes up places on Sunday — strong racecraft",
    "consistency": "Highly consistent, low-variance finisher",
    "reliability": "Dependable — reaches the flag",
    "podiums": "A regular podium threat",
    "scoring": "Reliable points scorer",
}
_WEAKNESS_PHRASE = {
    "qualifying": "Qualifying pace leaves time on the table",
    "racecraft": "Tends to lose ground on race day",
    "consistency": "Results swing week to week",
    "reliability": "Hampered by retirements / DNFs",
    "podiums": "Seldom in podium contention",
    "scoring": "Modest points return",
}


def _strengths_weaknesses(ratings: list[DriverRating]) -> tuple[list[str], list[str]]:
    ordered = sorted(ratings, key=lambda r: r.value, reverse=True)
    strengths = [
        f"{_STRENGTH_PHRASE[r.key]} ({r.detail})"
        for r in ordered
        if r.value >= 60 and r.key in _STRENGTH_PHRASE
    ][:3]
    if not strengths and ordered:  # relative strengths when nothing clears the bar
        strengths = [
            f"{_STRENGTH_PHRASE[r.key]} ({r.detail})"
            for r in ordered[:2]
            if r.key in _STRENGTH_PHRASE
        ]
    weaknesses = [
        f"{_WEAKNESS_PHRASE[r.key]} ({r.detail})"
        for r in reversed(ordered)
        if r.value < 40 and r.key in _WEAKNESS_PHRASE
    ][:2]
    return strengths, weaknesses


def driver_detail(db: Session, driver_ref: str) -> DriverDetailOut | None:
    driver = db.execute(
        select(Driver).where(Driver.driver_ref == driver_ref)
    ).scalar_one_or_none()
    if driver is None:
        return None

    # Per-result rows across the driver's whole ingested history
    result_rows = db.execute(
        select(
            Race.season,
            Race.round,
            Race.name,
            Race.date,
            Result.grid,
            Result.position,
            Result.position_text,
            Result.points,
            Result.status,
            Result.fastest_lap_rank,
            Result.constructor_id,
        )
        .join(Race, Result.race_id == Race.id)
        .where(Result.driver_id == driver.id)
        .order_by(Race.season, Race.round)
    ).all()

    if not result_rows:
        return DriverDetailOut(
            driver=_driver_out(driver),
            dob=driver.dob,
            current_constructor=None,
            teams=[],
            career=DriverCareerStats(
                seasons=0, first_season=None, last_season=None, races=0, wins=0,
                podiums=0, poles=0, fastest_laps=0, points=0.0, dnfs=0, titles=0,
                best_championship_position=None, win_rate=0.0, podium_rate=0.0,
                avg_grid=None, avg_finish=None,
            ),
            ratings=[], seasons=[], strengths=[], weaknesses=[], recent_results=[],
            data_since=None,
        )

    constructors = {
        c.id: c
        for c in db.execute(
            select(Constructor).where(
                Constructor.id.in_({r.constructor_id for r in result_rows})
            )
        ).scalars()
    }
    poles_by_season = _pole_counts_by_season(db, driver.id)
    champ_positions = _championship_positions(db, driver.id)

    # Career aggregates — a "finish" means a numeric position_text (see _finish_pos)
    races = len({(r.season, r.round) for r in result_rows})
    wins = sum(1 for r in result_rows if r.position_text == "1")
    finishes = [fp for r in result_rows if (fp := _finish_pos(r.position_text)) is not None]
    podiums = sum(1 for fp in finishes if fp <= 3)
    fastest_laps = sum(1 for r in result_rows if r.fastest_lap_rank == 1)
    points_total = sum(float(r.points or 0) for r in result_rows)
    dnfs = sum(1 for r in result_rows if r.position_text == "R")
    grids = [r.grid for r in result_rows if r.grid and r.grid > 0]
    seasons_present = sorted({r.season for r in result_rows})
    total_poles = sum(poles_by_season.values())
    titles = sum(1 for p in champ_positions.values() if p == 1)
    best_champ = min([p for p in champ_positions.values() if p is not None], default=None)

    avg_quali = _avg_quali(db, driver.id)

    ratings = _ratings(
        grids_finishes=[(r.grid, _finish_pos(r.position_text)) for r in result_rows],
        finishes=finishes,
        races=races,
        podiums=podiums,
        points=points_total,
        avg_quali=avg_quali,
    )
    strengths, weaknesses = _strengths_weaknesses(ratings)

    # Per-season breakdown
    seasons: list[DriverSeasonStat] = []
    for season in seasons_present:
        srows = [r for r in result_rows if r.season == season]
        s_constructor = constructors.get(srows[-1].constructor_id)
        s_finishes = [fp for r in srows if (fp := _finish_pos(r.position_text)) is not None]
        seasons.append(
            DriverSeasonStat(
                season=season,
                constructor=ConstructorOut.model_validate(s_constructor) if s_constructor else None,
                races=len({(r.season, r.round) for r in srows}),
                points=sum(float(r.points or 0) for r in srows),
                wins=sum(1 for r in srows if r.position_text == "1"),
                podiums=sum(1 for fp in s_finishes if fp <= 3),
                poles=poles_by_season.get(season, 0),
                best_finish=min(s_finishes) if s_finishes else None,
                championship_position=champ_positions.get(season),
            )
        )

    # Teams driven for, most recent first
    team_ids_ordered: list[int] = []
    for r in reversed(result_rows):
        if r.constructor_id not in team_ids_ordered:
            team_ids_ordered.append(r.constructor_id)
    teams = [
        ConstructorOut.model_validate(constructors[cid])
        for cid in team_ids_ordered
        if cid in constructors
    ]
    current_constructor = teams[0] if teams else None

    recent = [
        DriverResultLine(
            season=r.season,
            round=r.round,
            race_name=r.name,
            circuit=r.name,
            grid=r.grid,
            position=r.position,
            position_text=r.position_text,
            points=float(r.points or 0),
            status=r.status,
        )
        for r in result_rows[-8:][::-1]
    ]

    return DriverDetailOut(
        driver=_driver_out(driver),
        dob=driver.dob,
        current_constructor=current_constructor,
        teams=teams,
        career=DriverCareerStats(
            seasons=len(seasons_present),
            first_season=seasons_present[0],
            last_season=seasons_present[-1],
            races=races,
            wins=wins,
            podiums=podiums,
            poles=total_poles,
            fastest_laps=fastest_laps,
            points=points_total,
            dnfs=dnfs,
            titles=titles,
            best_championship_position=best_champ,
            win_rate=wins / races if races else 0.0,
            podium_rate=podiums / races if races else 0.0,
            avg_grid=statistics.fmean(grids) if grids else None,
            avg_finish=statistics.fmean(finishes) if finishes else None,
        ),
        ratings=ratings,
        seasons=seasons,
        strengths=strengths,
        weaknesses=weaknesses,
        recent_results=recent,
        data_since=seasons_present[0],
    )


def _pole_counts_by_season(db: Session, driver_id: int) -> dict[int, int]:
    rows = db.execute(
        select(Race.season, func.count())
        .join(QualifyingResult, QualifyingResult.race_id == Race.id)
        .where(QualifyingResult.driver_id == driver_id, QualifyingResult.position == 1)
        .group_by(Race.season)
    ).all()
    return dict(rows)


def _avg_quali(db: Session, driver_id: int) -> float | None:
    value = db.execute(
        select(func.avg(QualifyingResult.position)).where(
            QualifyingResult.driver_id == driver_id,
            QualifyingResult.position.isnot(None),
        )
    ).scalar()
    return float(value) if value is not None else None
