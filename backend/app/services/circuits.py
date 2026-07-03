"""Query + analytics logic behind the circuit endpoints.

Pure reads over ingested history: winners, most-successful drivers/teams,
pole-to-win conversion and attrition, plus the curated track metadata
(length, corners, DRS zones, lap record) seeded onto the circuits table.
"""

from __future__ import annotations

from datetime import date

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.f1 import Circuit, Constructor, Driver, Race, Result
from app.schemas.f1 import (
    CircuitDetailOut,
    CircuitListItem,
    CircuitOut,
    CircuitWinnerLine,
    ConstructorOut,
    TopEntry,
)
from app.services.dashboard import _driver_out
from app.services.drivers import _finish_pos


def _latest_season(db: Session) -> int | None:
    return db.execute(select(func.max(Race.season))).scalar()


def circuit_list(db: Session, search: str | None = None) -> list[CircuitListItem]:
    latest = _latest_season(db)

    # completed race aggregates per circuit (a race counts once it has results)
    agg_rows = db.execute(
        select(
            Race.circuit_id,
            func.count(func.distinct(Race.id)).label("races"),
            func.min(Race.season).label("first_year"),
            func.max(Race.season).label("last_year"),
        )
        .join(Result, Result.race_id == Race.id)
        .group_by(Race.circuit_id)
    ).all()
    agg = {r.circuit_id: r for r in agg_rows}

    on_calendar = set(
        db.execute(select(Race.circuit_id).where(Race.season == latest)).scalars()
    )

    # most recent winner per circuit
    winner_rows = db.execute(
        select(Race.circuit_id, Race.date, Driver.forename, Driver.surname)
        .join(Result, Result.race_id == Race.id)
        .join(Driver, Result.driver_id == Driver.id)
        .where(Result.position_text == "1")
        .order_by(Race.date)
    ).all()
    last_winner: dict[int, str] = {}
    for circuit_id, _, forename, surname in winner_rows:
        last_winner[circuit_id] = f"{forename} {surname}"  # later dates overwrite

    items: list[CircuitListItem] = []
    for circuit in db.execute(select(Circuit)).scalars():
        stats = agg.get(circuit.id)
        current = circuit.id in on_calendar
        if stats is None and not current:
            continue  # never raced in the ingested window and not scheduled
        if search and search.lower() not in f"{circuit.name} {circuit.location} {circuit.country}".lower():
            continue
        items.append(
            CircuitListItem(
                circuit=CircuitOut.model_validate(circuit),
                races_held=stats.races if stats else 0,
                first_year=stats.first_year if stats else None,
                last_year=stats.last_year if stats else None,
                on_current_calendar=current,
                last_winner=last_winner.get(circuit.id),
            )
        )

    items.sort(key=lambda i: (not i.on_current_calendar, -i.races_held, i.circuit.name))
    return items


def circuit_detail(db: Session, circuit_ref: str) -> CircuitDetailOut | None:
    circuit = db.execute(
        select(Circuit).where(Circuit.circuit_ref == circuit_ref)
    ).scalar_one_or_none()
    if circuit is None:
        return None

    latest = _latest_season(db)
    on_calendar = bool(
        db.execute(
            select(Race.id).where(Race.circuit_id == circuit.id, Race.season == latest).limit(1)
        ).scalar()
    )
    next_race_date = db.execute(
        select(func.min(Race.date)).where(
            Race.circuit_id == circuit.id, Race.date >= date.today()
        )
    ).scalar()

    # winners, most recent first
    winner_rows = db.execute(
        select(Race.season, Race.name, Result.grid, Result.time_text, Driver, Constructor)
        .join(Result, Result.race_id == Race.id)
        .join(Driver, Result.driver_id == Driver.id)
        .join(Constructor, Result.constructor_id == Constructor.id)
        .where(Race.circuit_id == circuit.id, Result.position_text == "1")
        .order_by(Race.season.desc())
    ).all()

    winners = [
        CircuitWinnerLine(
            season=season,
            race_name=name,
            driver=_driver_out(driver),
            constructor=ConstructorOut.model_validate(constructor),
            grid=grid,
            time_text=time_text,
        )
        for season, name, grid, time_text, driver, constructor in winner_rows
    ]

    races_held = len(winners)
    seasons = [w.season for w in winners]
    pole_wins = sum(1 for w in winners if w.grid == 1)

    # attrition + finisher counts across every entry at this circuit
    entry_rows = db.execute(
        select(Race.id, Result.position_text)
        .join(Result, Result.race_id == Race.id)
        .where(Race.circuit_id == circuit.id)
    ).all()
    entries = len(entry_rows)
    dnfs = sum(1 for _, pt in entry_rows if pt == "R")
    finishers_per_race: dict[int, int] = {}
    for race_id, pt in entry_rows:
        if _finish_pos(pt) is not None:
            finishers_per_race[race_id] = finishers_per_race.get(race_id, 0) + 1

    # most successful driver / constructor by wins here
    def top_entries(key: str) -> list[TopEntry]:
        counts: dict[str, TopEntry] = {}
        for w in winners:
            label = w.driver.full_name if key == "driver" else (w.constructor.name if w.constructor else "—")
            color = w.constructor.color if w.constructor else None
            entry = counts.get(label)
            counts[label] = TopEntry(label=label, color=color, value=(entry.value + 1) if entry else 1)
        return sorted(counts.values(), key=lambda e: e.value, reverse=True)[:5]

    return CircuitDetailOut(
        circuit=CircuitOut.model_validate(circuit),
        races_held=races_held,
        first_year=min(seasons) if seasons else None,
        last_year=max(seasons) if seasons else None,
        on_current_calendar=on_calendar,
        next_race_date=next_race_date,
        distinct_winners=len({w.driver.id for w in winners}),
        pole_win_rate=pole_wins / races_held if races_held else None,
        dnf_rate=dnfs / entries if entries else None,
        avg_finishers=(
            sum(finishers_per_race.values()) / len(finishers_per_race)
            if finishers_per_race
            else None
        ),
        top_drivers=top_entries("driver"),
        top_constructors=top_entries("constructor"),
        winners=winners,
        data_since=min(seasons) if seasons else None,
    )
