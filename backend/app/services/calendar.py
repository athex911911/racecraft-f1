"""Season calendar + single-race result reads (powers Calendar and History)."""

from __future__ import annotations

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.f1 import Circuit, Constructor, Driver, QualifyingResult, Race, Result
from app.schemas.f1 import (
    CalendarRace,
    CircuitOut,
    ConstructorOut,
    RaceDetailOut,
    RaceResultRow,
)
from app.services.dashboard import _driver_out


def season_years(db: Session) -> list[int]:
    return [
        y for (y,) in db.execute(select(Race.season).distinct().order_by(Race.season.desc())).all()
    ]


def _pole_by_race(db: Session, race_ids: list[int]) -> dict[int, str]:
    if not race_ids:
        return {}
    rows = db.execute(
        select(QualifyingResult.race_id, Driver.forename, Driver.surname)
        .join(Driver, QualifyingResult.driver_id == Driver.id)
        .where(QualifyingResult.race_id.in_(race_ids), QualifyingResult.position == 1)
    ).all()
    return {rid: f"{f} {s}" for rid, f, s in rows}


def season_races(db: Session, season: int) -> list[CalendarRace]:
    races = db.execute(
        select(Race).join(Circuit).where(Race.season == season).order_by(Race.round)
    ).scalars().all()
    if not races:
        return []
    race_ids = [r.id for r in races]

    winners = {
        rid: (f"{f} {s}", color)
        for rid, f, s, color in db.execute(
            select(Result.race_id, Driver.forename, Driver.surname, Constructor.color)
            .join(Driver, Result.driver_id == Driver.id)
            .join(Constructor, Result.constructor_id == Constructor.id)
            .where(Result.race_id.in_(race_ids), Result.position_text == "1")
        ).all()
    }
    completed = set(
        db.execute(
            select(Result.race_id).where(Result.race_id.in_(race_ids)).distinct()
        ).scalars()
    )
    poles = _pole_by_race(db, race_ids)

    out: list[CalendarRace] = []
    for r in races:
        winner = winners.get(r.id)
        out.append(
            CalendarRace(
                race_id=r.id,
                season=r.season,
                round=r.round,
                name=r.name,
                date=r.date,
                time=r.time,
                circuit=CircuitOut.model_validate(r.circuit),
                completed=r.id in completed,
                winner=winner[0] if winner else None,
                winner_color=winner[1] if winner else None,
                pole_sitter=poles.get(r.id),
            )
        )
    return out


def race_detail(db: Session, race_id: int) -> RaceDetailOut | None:
    race = db.execute(select(Race).join(Circuit).where(Race.id == race_id)).scalar_one_or_none()
    if race is None:
        return None

    rows = db.execute(
        select(Result, Driver, Constructor)
        .join(Driver, Result.driver_id == Driver.id)
        .join(Constructor, Result.constructor_id == Constructor.id)
        .where(Result.race_id == race_id)
        .order_by(Result.position_order.nulls_last(), Result.position.nulls_last())
    ).all()

    results = [
        RaceResultRow(
            position=res.position,
            position_text=res.position_text,
            driver=_driver_out(driver),
            constructor=ConstructorOut.model_validate(constructor),
            grid=res.grid,
            points=float(res.points or 0),
            status=res.status,
            fastest_lap=res.fastest_lap_rank == 1,
            time_text=res.time_text,
        )
        for res, driver, constructor in rows
    ]

    pole = db.execute(
        select(Driver.forename, Driver.surname)
        .join(QualifyingResult, QualifyingResult.driver_id == Driver.id)
        .where(QualifyingResult.race_id == race_id, QualifyingResult.position == 1)
        .limit(1)
    ).first()
    fl = db.execute(
        select(Driver.forename, Driver.surname)
        .join(Result, Result.driver_id == Driver.id)
        .where(Result.race_id == race_id, Result.fastest_lap_rank == 1)
        .limit(1)
    ).first()

    return RaceDetailOut(
        race_id=race.id,
        season=race.season,
        round=race.round,
        name=race.name,
        date=race.date,
        circuit=CircuitOut.model_validate(race.circuit),
        pole_sitter=f"{pole[0]} {pole[1]}" if pole else None,
        fastest_lap_driver=f"{fl[0]} {fl[1]}" if fl else None,
        results=results,
    )
