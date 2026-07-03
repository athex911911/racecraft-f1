"""Query + analytics logic behind the constructor endpoints.

Team-level mirror of app.services.drivers: real aggregates over every car the
constructor has entered, with 0–100 ratings normalised against team-level
reference bands. (pit_stops is empty in this dataset, so pit-stop ratings are
deferred; ratings come from race results.)
"""

from __future__ import annotations

import statistics

from sqlalchemy import and_, case, func, select
from sqlalchemy.orm import Session

from app.models.f1 import (
    Constructor,
    ConstructorStanding,
    Driver,
    QualifyingResult,
    Race,
    Result,
)
from app.schemas.f1 import (
    ConstructorCareerStats,
    ConstructorDetailOut,
    ConstructorDriver,
    ConstructorListItem,
    ConstructorOut,
    ConstructorResultLine,
    ConstructorSeasonStat,
    DriverOut,
    DriverRating,
)
from app.services.dashboard import _driver_out, resolve_season
from app.services.drivers import _NUMERIC_TEXT, _clamp, _finish_pos


def _pole_counts(db: Session, season: int | None, constructor_ids: list[int] | None = None) -> dict[int, int]:
    q = (
        select(QualifyingResult.constructor_id, func.count())
        .join(Race, QualifyingResult.race_id == Race.id)
        .where(QualifyingResult.position == 1)
        .group_by(QualifyingResult.constructor_id)
    )
    if season is not None:
        q = q.where(Race.season == season)
    if constructor_ids is not None:
        q = q.where(QualifyingResult.constructor_id.in_(constructor_ids))
    return dict(db.execute(q).all())


def _lineup(db: Session, constructor_ids: list[int], season: int | None, per_team: int = 3) -> dict[int, list[Driver]]:
    """Most relevant drivers per constructor: the season's line-up, or (all-time)
    the most recent drivers. Carries headshots for the card imagery."""
    if not constructor_ids:
        return {}
    q = (
        select(
            Result.constructor_id,
            Result.driver_id,
            func.count(func.distinct(Result.race_id)).label("races"),
            func.max(Race.date).label("last_date"),
        )
        .join(Race, Result.race_id == Race.id)
        .where(Result.constructor_id.in_(constructor_ids))
        .group_by(Result.constructor_id, Result.driver_id)
    )
    if season is not None:
        q = q.where(Race.season == season)
    rows = db.execute(q).all()

    drivers = {
        d.id: d
        for d in db.execute(select(Driver).where(Driver.id.in_({r.driver_id for r in rows}))).scalars()
    }
    by_team: dict[int, list] = {}
    for r in rows:
        by_team.setdefault(r.constructor_id, []).append(r)
    out: dict[int, list[Driver]] = {}
    for cid, team_rows in by_team.items():
        team_rows.sort(key=lambda r: (r.last_date, r.races), reverse=True)
        out[cid] = [drivers[r.driver_id] for r in team_rows[:per_team] if r.driver_id in drivers]
    return out


def _championship_positions(db: Session, constructor_id: int) -> dict[int, int | None]:
    rows = db.execute(
        select(Race.season, ConstructorStanding.position)
        .join(Race, ConstructorStanding.race_id == Race.id)
        .where(ConstructorStanding.constructor_id == constructor_id)
        .order_by(Race.season, Race.round)
    ).all()
    positions: dict[int, int | None] = {}
    for season, position in rows:
        positions[season] = position
    return positions


def constructor_list(
    db: Session,
    season: str | int | None = "current",
    search: str | None = None,
    limit: int = 100,
) -> list[ConstructorListItem]:
    all_time = str(season).lower() == "all"
    resolved: int | None = None if all_time else resolve_season(db, season)

    agg = (
        select(
            Result.constructor_id,
            func.count(func.distinct(Result.race_id)).label("races"),
            func.coalesce(func.sum(Result.points), 0.0).label("points"),
            func.sum(case((Result.position_text == "1", 1), else_=0)).label("wins"),
            func.sum(case((and_(_NUMERIC_TEXT, Result.position <= 3), 1), else_=0)).label("podiums"),
        )
        .join(Race, Result.race_id == Race.id)
        .group_by(Result.constructor_id)
    )
    if resolved is not None:
        agg = agg.where(Race.season == resolved)
    rows = db.execute(agg).all()
    if not rows:
        return []

    ids = [r.constructor_id for r in rows]
    constructors = {
        c.id: c for c in db.execute(select(Constructor).where(Constructor.id.in_(ids))).scalars()
    }
    poles = _pole_counts(db, resolved, ids)
    lineups = _lineup(db, ids, resolved, per_team=3 if all_time else 4)
    champ = _season_champ_positions(db, resolved, ids) if resolved is not None else {}

    items: list[ConstructorListItem] = []
    for r in rows:
        c = constructors.get(r.constructor_id)
        if c is None:
            continue
        if search and search.lower() not in c.name.lower():
            continue
        items.append(
            ConstructorListItem(
                constructor=ConstructorOut.model_validate(c),
                season=resolved,
                races=r.races,
                wins=int(r.wins or 0),
                podiums=int(r.podiums or 0),
                poles=poles.get(r.constructor_id, 0),
                points=float(r.points or 0.0),
                championship_position=champ.get(r.constructor_id),
                drivers=[_driver_out(d) for d in lineups.get(r.constructor_id, [])],
            )
        )
    items.sort(key=lambda i: (i.points, i.wins, i.podiums), reverse=True)
    return items[:limit]


def _season_champ_positions(db: Session, season: int, constructor_ids: list[int]) -> dict[int, int | None]:
    """Final constructor-championship position for a single season."""
    last_round = db.execute(
        select(func.max(Race.round))
        .join(ConstructorStanding, ConstructorStanding.race_id == Race.id)
        .where(Race.season == season)
    ).scalar()
    if last_round is None:
        return {}
    rows = db.execute(
        select(ConstructorStanding.constructor_id, ConstructorStanding.position)
        .join(Race, ConstructorStanding.race_id == Race.id)
        .where(Race.season == season, Race.round == last_round,
               ConstructorStanding.constructor_id.in_(constructor_ids))
    ).all()
    return {cid: pos for cid, pos in rows}


_STRENGTH = {
    "wins": "A genuine race-winning force",
    "podiums": "A frequent podium presence",
    "qualifying": "Strong one-lap qualifying pace",
    "reliability": "Excellent car reliability",
    "scoring": "A heavy points-scoring machine",
    "consistency": "Consistent, low-variance results",
}
_WEAKNESS = {
    "wins": "Wins are hard to come by",
    "podiums": "Rarely troubles the podium",
    "qualifying": "Qualifying pace is a weak point",
    "reliability": "Reliability lets them down",
    "scoring": "A modest points return",
    "consistency": "Results swing race to race",
}


def _strengths_weaknesses(ratings: list[DriverRating]) -> tuple[list[str], list[str]]:
    ordered = sorted(ratings, key=lambda r: r.value, reverse=True)
    strengths = [f"{_STRENGTH[r.key]} ({r.detail})" for r in ordered if r.value >= 60 and r.key in _STRENGTH][:3]
    if not strengths and ordered:
        strengths = [f"{_STRENGTH[r.key]} ({r.detail})" for r in ordered[:2] if r.key in _STRENGTH]
    weaknesses = [
        f"{_WEAKNESS[r.key]} ({r.detail})" for r in reversed(ordered) if r.value < 40 and r.key in _WEAKNESS
    ][:2]
    return strengths, weaknesses


def _ratings(grids: list[int], finishes: list[int], entries: int, races: int,
             wins: int, podiums: int, points: float) -> list[DriverRating]:
    ratings: list[DriverRating] = []
    if races:
        wr = wins / races
        ratings.append(DriverRating(key="wins", label="Wins", value=round(_clamp(100 * wr / 0.5), 1),
                                    detail=f"{wr * 100:.0f}% of races won"))
        pr = podiums / races
        ratings.append(DriverRating(key="podiums", label="Podiums", value=round(_clamp(100 * pr / 1.0), 1),
                                    detail=f"{pr:.2f} podiums/race"))
    if grids:
        avg_grid = statistics.fmean(grids)
        ratings.append(DriverRating(key="qualifying", label="Qualifying",
                                    value=round(_clamp(100 * (20 - avg_grid) / 19), 1),
                                    detail=f"Avg grid P{avg_grid:.1f}"))
    if entries:
        rel = len(finishes) / entries
        ratings.append(DriverRating(key="reliability", label="Reliability", value=round(_clamp(100 * rel), 1),
                                    detail=f"{rel * 100:.0f}% cars classified"))
    if races:
        ppr = points / races
        ratings.append(DriverRating(key="scoring", label="Scoring", value=round(_clamp(100 * ppr / 30), 1),
                                    detail=f"{ppr:.1f} pts/race"))
    if len(finishes) >= 2:
        spread = statistics.pstdev(finishes)
        ratings.append(DriverRating(key="consistency", label="Consistency", value=round(_clamp(100 * (1 - spread / 8)), 1),
                                    detail=f"σ {spread:.1f} finishing pos"))
    return ratings


def constructor_detail(db: Session, constructor_ref: str) -> ConstructorDetailOut | None:
    constructor = db.execute(
        select(Constructor).where(Constructor.constructor_ref == constructor_ref)
    ).scalar_one_or_none()
    if constructor is None:
        return None

    rows = db.execute(
        select(
            Race.season, Race.round, Race.name, Race.date,
            Result.driver_id, Result.grid, Result.position, Result.position_text,
            Result.points, Result.status, Result.fastest_lap_rank,
        )
        .join(Race, Result.race_id == Race.id)
        .where(Result.constructor_id == constructor.id)
        .order_by(Race.season, Race.round)
    ).all()

    if not rows:
        return ConstructorDetailOut(
            constructor=ConstructorOut.model_validate(constructor),
            career=ConstructorCareerStats(
                seasons=0, first_season=None, last_season=None, races=0, entries=0, wins=0,
                podiums=0, poles=0, one_twos=0, fastest_laps=0, points=0.0, dnfs=0, titles=0,
                best_championship_position=None, win_rate=0.0, podium_rate=0.0, avg_grid=None, avg_finish=None,
            ),
            ratings=[], seasons=[], drivers=[], strengths=[], weaknesses=[], recent_results=[], data_since=None,
        )

    drivers = {
        d.id: d for d in db.execute(select(Driver).where(Driver.id.in_({r.driver_id for r in rows}))).scalars()
    }
    poles_by_season = _pole_counts_by_season(db, constructor.id)
    total_poles = sum(poles_by_season.values())
    champ_positions = _championship_positions(db, constructor.id)

    race_keys = {(r.season, r.round) for r in rows}
    races = len(race_keys)
    entries = len(rows)
    wins = sum(1 for r in rows if r.position_text == "1")
    finishes = [fp for r in rows if (fp := _finish_pos(r.position_text)) is not None]
    podiums = sum(1 for fp in finishes if fp <= 3)
    fastest_laps = sum(1 for r in rows if r.fastest_lap_rank == 1)
    points_total = sum(float(r.points or 0) for r in rows)
    dnfs = sum(1 for r in rows if r.position_text == "R")
    grids = [r.grid for r in rows if r.grid and r.grid > 0]
    seasons_present = sorted({r.season for r in rows})

    # one-twos: races where the team took both P1 and P2
    per_race_finishes: dict[tuple[int, int], set[int]] = {}
    for r in rows:
        fp = _finish_pos(r.position_text)
        if fp is not None:
            per_race_finishes.setdefault((r.season, r.round), set()).add(fp)
    one_twos = sum(1 for s in per_race_finishes.values() if 1 in s and 2 in s)

    titles = sum(1 for p in champ_positions.values() if p == 1)
    best_champ = min([p for p in champ_positions.values() if p is not None], default=None)

    ratings = _ratings(grids, finishes, entries, races, wins, podiums, points_total)
    strengths, weaknesses = _strengths_weaknesses(ratings)

    # per-season breakdown
    seasons: list[ConstructorSeasonStat] = []
    for season in seasons_present:
        srows = [r for r in rows if r.season == season]
        s_finishes = [fp for r in srows if (fp := _finish_pos(r.position_text)) is not None]
        seasons.append(
            ConstructorSeasonStat(
                season=season,
                constructor=ConstructorOut.model_validate(constructor),
                races=len({(r.season, r.round) for r in srows}),
                points=sum(float(r.points or 0) for r in srows),
                wins=sum(1 for r in srows if r.position_text == "1"),
                podiums=sum(1 for fp in s_finishes if fp <= 3),
                poles=poles_by_season.get(season, 0),
                best_finish=min(s_finishes) if s_finishes else None,
                championship_position=champ_positions.get(season),
            )
        )

    # driver line-up / alumni, most recent first
    driver_stats: dict[int, dict] = {}
    for r in rows:
        st = driver_stats.setdefault(r.driver_id, {"races": set(), "seasons": set(), "last": r.date})
        st["races"].add((r.season, r.round))
        st["seasons"].add(r.season)
        if r.date > st["last"]:
            st["last"] = r.date
    lineup = sorted(driver_stats.items(), key=lambda kv: kv[1]["last"], reverse=True)
    last_season = seasons_present[-1]
    team_drivers = [
        ConstructorDriver(
            driver=_driver_out(drivers[did]),
            races=len(st["races"]),
            seasons=len(st["seasons"]),
            is_current=last_season in st["seasons"],
        )
        for did, st in lineup
        if did in drivers
    ]

    # recent results, aggregated per race
    recent = _recent_results(rows, drivers)

    return ConstructorDetailOut(
        constructor=ConstructorOut.model_validate(constructor),
        career=ConstructorCareerStats(
            seasons=len(seasons_present),
            first_season=seasons_present[0],
            last_season=last_season,
            races=races,
            entries=entries,
            wins=wins,
            podiums=podiums,
            poles=total_poles,
            one_twos=one_twos,
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
        drivers=team_drivers,
        strengths=strengths,
        weaknesses=weaknesses,
        recent_results=recent,
        data_since=seasons_present[0],
    )


def _recent_results(rows, drivers, limit: int = 6) -> list[ConstructorResultLine]:
    by_race: dict[tuple[int, int], list] = {}
    order: list[tuple[int, int]] = []
    for r in rows:
        key = (r.season, r.round)
        if key not in by_race:
            by_race[key] = []
            order.append(key)
        by_race[key].append(r)

    out: list[ConstructorResultLine] = []
    for key in order[-limit:][::-1]:
        car_rows = by_race[key]
        first = car_rows[0]
        finishes = [fp for r in car_rows if (fp := _finish_pos(r.position_text)) is not None]
        car_results = []
        for r in sorted(car_rows, key=lambda r: _finish_pos(r.position_text) or 99):
            d = drivers.get(r.driver_id)
            code = (d.code if d else None) or (d.surname[:3].upper() if d else "—")
            fp = _finish_pos(r.position_text)
            car_results.append(f"{code} {'P' + str(fp) if fp else (r.position_text or '—')}")
        out.append(
            ConstructorResultLine(
                season=first.season,
                round=first.round,
                race_name=first.name,
                best_position=min(finishes) if finishes else None,
                points=sum(float(r.points or 0) for r in car_rows),
                car_results=car_results,
            )
        )
    return out


def _pole_counts_by_season(db: Session, constructor_id: int) -> dict[int, int]:
    rows = db.execute(
        select(Race.season, func.count())
        .join(QualifyingResult, QualifyingResult.race_id == Race.id)
        .where(QualifyingResult.constructor_id == constructor_id, QualifyingResult.position == 1)
        .group_by(Race.season)
    ).all()
    return dict(rows)
