"""All-time record aggregates across the ingested history (powers Hall of Fame)."""

from __future__ import annotations

from sqlalchemy import and_, func, select
from sqlalchemy.orm import Session

from app.models.f1 import (
    Constructor,
    ConstructorStanding,
    Driver,
    DriverStanding,
    QualifyingResult,
    Race,
    Result,
)
from app.schemas.f1 import HallOfFameOut, RecordCategory, RecordEntry
from app.services.drivers import _NUMERIC_TEXT

TOP_N = 5


def _champions(db: Session, standing_model, id_col) -> dict[int, int]:
    """Titles per entity: winner of the final ingested standings round each season."""
    rows = db.execute(
        select(Race.season, Race.round, id_col, standing_model.position)
        .select_from(standing_model)
        .join(Race, standing_model.race_id == Race.id)
        .order_by(Race.season, Race.round)
    ).all()
    final_round: dict[int, int] = {}
    for season, rnd, _, _pos in rows:
        final_round[season] = max(final_round.get(season, 0), rnd)
    titles: dict[int, int] = {}
    for season, rnd, entity_id, pos in rows:
        if rnd == final_round.get(season) and pos == 1:
            titles[entity_id] = titles.get(entity_id, 0) + 1
    return titles


def hall_of_fame(db: Session) -> HallOfFameOut:
    lo, hi = db.execute(select(func.min(Race.season), func.max(Race.season))).first()

    # --- driver records ---
    def d_base():
        return (
            select(Driver.driver_ref, Driver.forename, Driver.surname)
            .select_from(Result)
            .join(Race, Result.race_id == Race.id)
            .join(Driver, Result.driver_id == Driver.id)
            .group_by(Driver.driver_ref, Driver.forename, Driver.surname)
        )

    def d_cat(key, title, where, count=func.count()) -> RecordCategory:
        rows = db.execute(
            d_base().add_columns(count.label("v")).where(where).order_by(count.desc()).limit(TOP_N)
        ).all()
        return RecordCategory(
            key=key, title=title,
            entries=[RecordEntry(ref=r[0], label=f"{r[1]} {r[2]}", color=None, value=float(r[3]), display=str(int(r[3]))) for r in rows],
        )

    driver_wins = d_cat("driver_wins", "Most Wins", Result.position_text == "1")
    driver_podiums = d_cat("driver_podiums", "Most Podiums", and_(_NUMERIC_TEXT, Result.position <= 3))
    driver_fl = d_cat("driver_fl", "Most Fastest Laps", Result.fastest_lap_rank == 1)
    driver_starts = RecordCategory(
        key="driver_starts", title="Most Race Starts",
        entries=[
            RecordEntry(ref=r[0], label=f"{r[1]} {r[2]}", color=None, value=float(r[3]), display=str(int(r[3])))
            for r in db.execute(
                select(Driver.driver_ref, Driver.forename, Driver.surname, func.count(func.distinct(Result.race_id)).label("v"))
                .select_from(Result)
                .join(Driver, Result.driver_id == Driver.id)
                .group_by(Driver.driver_ref, Driver.forename, Driver.surname)
                .order_by(func.count(func.distinct(Result.race_id)).desc())
                .limit(TOP_N)
            ).all()
        ],
    )

    pole_rows = db.execute(
        select(Driver.driver_ref, Driver.forename, Driver.surname, func.count().label("v"))
        .select_from(QualifyingResult)
        .join(Driver, QualifyingResult.driver_id == Driver.id)
        .where(QualifyingResult.position == 1)
        .group_by(Driver.driver_ref, Driver.forename, Driver.surname)
        .order_by(func.count().desc())
        .limit(TOP_N)
    ).all()
    driver_poles = RecordCategory(
        key="driver_poles", title="Most Pole Positions",
        entries=[RecordEntry(ref=r[0], label=f"{r[1]} {r[2]}", color=None, value=float(r[3]), display=str(int(r[3]))) for r in pole_rows],
    )

    d_titles = _champions(db, DriverStanding, DriverStanding.driver_id)
    driver_meta = {
        d.id: (d.driver_ref, f"{d.forename} {d.surname}")
        for d in db.execute(select(Driver).where(Driver.id.in_(d_titles or [0]))).scalars()
    }
    driver_titles = RecordCategory(
        key="driver_titles", title="World Championships",
        entries=[
            RecordEntry(ref=driver_meta[i][0], label=driver_meta[i][1], color="#FFD700", value=float(n), display=f"{int(n)}×")
            for i, n in sorted(d_titles.items(), key=lambda kv: kv[1], reverse=True)[:TOP_N]
        ],
    )

    # --- constructor records ---
    def c_cat(key, title, where, count=func.count()) -> RecordCategory:
        rows = db.execute(
            select(Constructor.constructor_ref, Constructor.name, Constructor.color, count.label("v"))
            .select_from(Result)
            .join(Race, Result.race_id == Race.id)
            .join(Constructor, Result.constructor_id == Constructor.id)
            .where(where)
            .group_by(Constructor.constructor_ref, Constructor.name, Constructor.color)
            .order_by(count.desc())
            .limit(TOP_N)
        ).all()
        return RecordCategory(
            key=key, title=title,
            entries=[RecordEntry(ref=r[0], label=r[1], color=r[2], value=float(r[3]), display=str(int(r[3]))) for r in rows],
        )

    con_wins = c_cat("con_wins", "Most Wins", Result.position_text == "1")
    con_podiums = c_cat("con_podiums", "Most Podiums", and_(_NUMERIC_TEXT, Result.position <= 3))

    con_pole_rows = db.execute(
        select(Constructor.constructor_ref, Constructor.name, Constructor.color, func.count().label("v"))
        .select_from(QualifyingResult)
        .join(Constructor, QualifyingResult.constructor_id == Constructor.id)
        .where(QualifyingResult.position == 1)
        .group_by(Constructor.constructor_ref, Constructor.name, Constructor.color)
        .order_by(func.count().desc())
        .limit(TOP_N)
    ).all()
    con_poles = RecordCategory(
        key="con_poles", title="Most Pole Positions",
        entries=[RecordEntry(ref=r[0], label=r[1], color=r[2], value=float(r[3]), display=str(int(r[3]))) for r in con_pole_rows],
    )

    c_titles = _champions(db, ConstructorStanding, ConstructorStanding.constructor_id)
    con_meta = {
        c.id: (c.constructor_ref, c.name, c.color)
        for c in db.execute(select(Constructor).where(Constructor.id.in_(c_titles or [0]))).scalars()
    }
    con_titles = RecordCategory(
        key="con_titles", title="Constructors' Titles",
        entries=[
            RecordEntry(ref=con_meta[i][0], label=con_meta[i][1], color=con_meta[i][2], value=float(n), display=f"{int(n)}×")
            for i, n in sorted(c_titles.items(), key=lambda kv: kv[1], reverse=True)[:TOP_N]
        ],
    )

    return HallOfFameOut(
        seasons_covered=f"{lo}–{hi}" if lo and hi else "—",
        drivers=[driver_titles, driver_wins, driver_poles, driver_podiums, driver_fl, driver_starts],
        constructors=[con_titles, con_wins, con_poles, con_podiums],
    )
