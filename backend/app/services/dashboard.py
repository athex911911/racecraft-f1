"""Query logic behind the dashboard endpoints. All functions are pure reads."""

from datetime import date

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.f1 import (
    Circuit,
    Constructor,
    ConstructorStanding,
    Driver,
    DriverStanding,
    QualifyingResult,
    Race,
    Result,
    SprintResult,
)
from app.schemas.f1 import (
    ChampionshipProgressOut,
    CircuitOut,
    ConstructorOut,
    ConstructorStandingOut,
    DriverOut,
    DriverStandingOut,
    NextRaceOut,
    PodiumEntry,
    ProgressPoint,
    ProgressSeries,
    RaceSummaryOut,
    SeasonProgressOut,
    SessionSlot,
    TrendingStat,
)


def resolve_season(db: Session, season: int | str | None) -> int:
    if season not in (None, "current"):
        return int(season)
    latest = db.execute(
        select(func.max(Race.season)).join(Result, Result.race_id == Race.id)
    ).scalar()
    if latest is None:
        latest = db.execute(select(func.max(Race.season))).scalar()
    return latest or date.today().year


def _standings_race_id(db: Session, season: int, table) -> int | None:
    """Race carrying the season's most recent ingested standings."""
    return db.execute(
        select(Race.id)
        .join(table, table.race_id == Race.id)
        .where(Race.season == season)
        .order_by(Race.round.desc())
        .limit(1)
    ).scalar()


def _driver_constructor_map(db: Session, season: int) -> dict[int, Constructor]:
    """Each driver's most recent constructor within the season."""
    rows = db.execute(
        select(Result.driver_id, Constructor, Race.round)
        .join(Race, Result.race_id == Race.id)
        .join(Constructor, Result.constructor_id == Constructor.id)
        .where(Race.season == season)
        .order_by(Race.round)
    ).all()
    mapping: dict[int, Constructor] = {}
    for driver_id, constructor, _ in rows:
        mapping[driver_id] = constructor  # later rounds overwrite earlier
    return mapping


def _podium_counts(db: Session, season: int, by_constructor: bool = False) -> dict[int, int]:
    key = Result.constructor_id if by_constructor else Result.driver_id
    rows = db.execute(
        select(key, func.count())
        .join(Race, Result.race_id == Race.id)
        .where(Race.season == season, Result.position <= 3)
        .group_by(key)
    ).all()
    return dict(rows)


def driver_standings(db: Session, season: int) -> list[DriverStandingOut]:
    race_id = _standings_race_id(db, season, DriverStanding)
    if race_id is None:
        return []
    rows = db.execute(
        select(DriverStanding, Driver)
        .join(Driver, DriverStanding.driver_id == Driver.id)
        .where(DriverStanding.race_id == race_id)
        .order_by(DriverStanding.position)
    ).all()

    constructors = _driver_constructor_map(db, season)
    podiums = _podium_counts(db, season)

    # last five finishes per driver, newest last
    finish_rows = db.execute(
        select(Result.driver_id, Result.position_text, Race.round)
        .join(Race, Result.race_id == Race.id)
        .where(Race.season == season)
        .order_by(Race.round)
    ).all()
    finishes: dict[int, list[str]] = {}
    for driver_id, pos_text, _ in finish_rows:
        finishes.setdefault(driver_id, []).append(pos_text or "-")

    out = []
    for standing, driver in rows:
        constructor = constructors.get(driver.id)
        out.append(
            DriverStandingOut(
                position=standing.position or 0,
                points=standing.points,
                wins=standing.wins,
                podiums=podiums.get(driver.id, 0),
                driver=_driver_out(driver),
                constructor=ConstructorOut.model_validate(constructor) if constructor else None,
                last_five=finishes.get(driver.id, [])[-5:],
            )
        )
    return out


def constructor_standings(db: Session, season: int) -> list[ConstructorStandingOut]:
    race_id = _standings_race_id(db, season, ConstructorStanding)
    if race_id is None:
        return []
    rows = db.execute(
        select(ConstructorStanding, Constructor)
        .join(Constructor, ConstructorStanding.constructor_id == Constructor.id)
        .where(ConstructorStanding.race_id == race_id)
        .order_by(ConstructorStanding.position)
    ).all()

    podiums = _podium_counts(db, season, by_constructor=True)

    driver_rows = db.execute(
        select(Result.constructor_id, Driver)
        .join(Race, Result.race_id == Race.id)
        .join(Driver, Result.driver_id == Driver.id)
        .where(Race.season == season)
        .distinct()
    ).all()
    team_drivers: dict[int, list[Driver]] = {}
    for constructor_id, driver in driver_rows:
        team_drivers.setdefault(constructor_id, []).append(driver)

    points_rows = db.execute(
        select(Result.constructor_id, Race.round, func.sum(Result.points))
        .join(Race, Result.race_id == Race.id)
        .where(Race.season == season)
        .group_by(Result.constructor_id, Race.round)
        .order_by(Race.round)
    ).all()
    round_points: dict[int, list[float]] = {}
    for constructor_id, _, pts in points_rows:
        round_points.setdefault(constructor_id, []).append(float(pts or 0))

    out = []
    for standing, constructor in rows:
        out.append(
            ConstructorStandingOut(
                position=standing.position or 0,
                points=standing.points,
                wins=standing.wins,
                podiums=podiums.get(constructor.id, 0),
                constructor=ConstructorOut.model_validate(constructor),
                drivers=[_driver_out(d) for d in team_drivers.get(constructor.id, [])],
                last_five_points=round_points.get(constructor.id, [])[-5:],
            )
        )
    return out


def next_race(db: Session, season: int | None = None) -> NextRaceOut | None:
    q = select(Race).join(Circuit).where(Race.date >= date.today()).order_by(Race.date)
    if season:
        q = q.where(Race.season == season)
    race = db.execute(q.limit(1)).scalar_one_or_none()
    if race is None:
        return None

    def latest_at_circuit(condition) -> str | None:
        row = db.execute(
            select(Driver.forename, Driver.surname)
            .join(Result, Result.driver_id == Driver.id)
            .join(Race, Result.race_id == Race.id)
            .where(Race.circuit_id == race.circuit_id, Race.date < date.today(), condition)
            .order_by(Race.date.desc())
            .limit(1)
        ).first()
        return f"{row[0]} {row[1]}" if row else None

    pole_row = db.execute(
        select(Driver.forename, Driver.surname)
        .join(QualifyingResult, QualifyingResult.driver_id == Driver.id)
        .join(Race, QualifyingResult.race_id == Race.id)
        .where(Race.circuit_id == race.circuit_id, Race.date < date.today(),
               QualifyingResult.position == 1)
        .order_by(Race.date.desc())
        .limit(1)
    ).first()

    schedule = [
        SessionSlot(name=name, starts_at=value)
        for name, value in [
            ("Practice 1", race.fp1),
            ("Practice 2", race.fp2),
            ("Practice 3", race.fp3),
            ("Sprint", race.sprint),
            ("Qualifying", race.qualifying),
        ]
        if value is not None
    ]

    return NextRaceOut(
        race_id=race.id,
        season=race.season,
        round=race.round,
        name=race.name,
        date=race.date,
        time=race.time,
        circuit=CircuitOut.model_validate(race.circuit),
        schedule=schedule,
        previous_winner=latest_at_circuit(Result.position == 1),
        previous_pole=f"{pole_row[0]} {pole_row[1]}" if pole_row else None,
        previous_fastest_lap=latest_at_circuit(Result.fastest_lap_rank == 1),
    )


def season_progress(db: Session, season: int) -> SeasonProgressOut:
    total = db.execute(select(func.count()).where(Race.season == season)).scalar() or 0
    completed = (
        db.execute(
            select(func.count(func.distinct(Result.race_id)))
            .select_from(Result)
            .join(Race, Result.race_id == Race.id)
            .where(Race.season == season)
        ).scalar()
        or 0
    )
    drivers = driver_standings(db, season)
    constructors = constructor_standings(db, season)
    return SeasonProgressOut(
        season=season,
        total_rounds=total,
        completed_rounds=completed,
        leader=drivers[0] if drivers else None,
        leading_constructor=constructors[0] if constructors else None,
        next_race=next_race(db, season) or next_race(db),
    )


def championship_progress(db: Session, season: int, entity_type: str) -> ChampionshipProgressOut:
    """Cumulative points per round computed from race + sprint results."""
    race_names = dict(
        db.execute(select(Race.round, Race.name).where(Race.season == season)).all()
    )

    def collect(model) -> list[tuple[int, int, float]]:
        key = model.driver_id if entity_type == "driver" else model.constructor_id
        return db.execute(
            select(key, Race.round, func.sum(model.points))
            .join(Race, model.race_id == Race.id)
            .where(Race.season == season)
            .group_by(key, Race.round)
        ).all()

    totals: dict[int, dict[int, float]] = {}
    for model in (Result, SprintResult):
        for entity_id, rnd, pts in collect(model):
            totals.setdefault(entity_id, {})[rnd] = totals.setdefault(entity_id, {}).get(
                rnd, 0.0
            ) + float(pts or 0)

    if entity_type == "driver":
        labels = {
            d.id: (f"{d.forename} {d.surname}", None)
            for d in db.execute(select(Driver).where(Driver.id.in_(totals))).scalars()
        }
        constructors = _driver_constructor_map(db, season)
        labels = {
            did: (name, constructors[did].color if did in constructors else None)
            for did, (name, _) in labels.items()
        }
    else:
        labels = {
            c.id: (c.name, c.color)
            for c in db.execute(select(Constructor).where(Constructor.id.in_(totals))).scalars()
        }

    all_rounds = sorted({r for per in totals.values() for r in per})
    series = []
    for entity_id, per_round in totals.items():
        label, color = labels.get(entity_id, (str(entity_id), None))
        cumulative, points = 0.0, []
        for rnd in all_rounds:
            cumulative += per_round.get(rnd, 0.0)
            points.append(
                ProgressPoint(round=rnd, race_name=race_names.get(rnd, f"Round {rnd}"), points=cumulative)
            )
        series.append(ProgressSeries(entity_id=entity_id, label=label, color=color, points=points))

    series.sort(key=lambda s: s.points[-1].points if s.points else 0, reverse=True)
    return ChampionshipProgressOut(season=season, entity_type=entity_type, series=series)


def trending_stats(db: Session, season: int) -> list[TrendingStat]:
    constructors = _driver_constructor_map(db, season)

    def color_of(driver_id: int) -> str | None:
        c = constructors.get(driver_id)
        return c.color if c else None

    stats: list[TrendingStat] = []

    def add_driver_stat(key: str, label: str, row, value_fmt: str, detail: str | None = None):
        if row:
            driver_id, forename, surname, value = row
            stats.append(
                TrendingStat(
                    key=key,
                    label=label,
                    holder=f"{forename} {surname}",
                    detail=detail,
                    value=value_fmt.format(value),
                    color=color_of(driver_id),
                )
            )

    base = (
        select(Result.driver_id, Driver.forename, Driver.surname)
        .join(Race, Result.race_id == Race.id)
        .join(Driver, Result.driver_id == Driver.id)
        .where(Race.season == season)
        .group_by(Result.driver_id, Driver.forename, Driver.surname)
    )

    add_driver_stat(
        "most_wins", "Most Wins",
        db.execute(
            base.add_columns(func.count().label("v"))
            .where(Result.position == 1)
            .order_by(func.count().desc())
            .limit(1)
        ).first(),
        "{}",
    )

    pole_row = db.execute(
        select(QualifyingResult.driver_id, Driver.forename, Driver.surname, func.count())
        .join(Race, QualifyingResult.race_id == Race.id)
        .join(Driver, QualifyingResult.driver_id == Driver.id)
        .where(Race.season == season, QualifyingResult.position == 1)
        .group_by(QualifyingResult.driver_id, Driver.forename, Driver.surname)
        .order_by(func.count().desc())
        .limit(1)
    ).first()
    add_driver_stat("most_poles", "Most Poles", pole_row, "{}")

    add_driver_stat(
        "most_fastest_laps", "Most Fastest Laps",
        db.execute(
            base.add_columns(func.count().label("v"))
            .where(Result.fastest_lap_rank == 1)
            .order_by(func.count().desc())
            .limit(1)
        ).first(),
        "{}",
    )

    add_driver_stat(
        "most_podiums", "Most Podiums",
        db.execute(
            base.add_columns(func.count().label("v"))
            .where(Result.position <= 3)
            .order_by(func.count().desc())
            .limit(1)
        ).first(),
        "{}",
    )

    gain_row = db.execute(
        base.add_columns(func.sum(Result.grid - Result.position).label("v"))
        .where(Result.position.isnot(None), Result.grid > 0)
        .order_by(func.sum(Result.grid - Result.position).desc())
        .limit(1)
    ).first()
    add_driver_stat("most_places_gained", "Most Places Gained", gain_row, "+{}")

    avg_row = db.execute(
        base.add_columns(func.avg(Result.position).label("v"))
        .where(Result.position.isnot(None))
        .having(func.count() >= 3)
        .order_by(func.avg(Result.position))
        .limit(1)
    ).first()
    if avg_row:
        driver_id, forename, surname, value = avg_row
        stats.append(
            TrendingStat(
                key="best_avg_finish", label="Best Average Finish",
                holder=f"{forename} {surname}", detail=None,
                value=f"P{float(value):.1f}", color=color_of(driver_id),
            )
        )

    quali_row = db.execute(
        select(QualifyingResult.driver_id, Driver.forename, Driver.surname,
               func.avg(QualifyingResult.position))
        .join(Race, QualifyingResult.race_id == Race.id)
        .join(Driver, QualifyingResult.driver_id == Driver.id)
        .where(Race.season == season, QualifyingResult.position.isnot(None))
        .group_by(QualifyingResult.driver_id, Driver.forename, Driver.surname)
        .having(func.count() >= 3)
        .order_by(func.avg(QualifyingResult.position))
        .limit(1)
    ).first()
    if quali_row:
        driver_id, forename, surname, value = quali_row
        stats.append(
            TrendingStat(
                key="best_qualifier", label="Best Qualifier",
                holder=f"{forename} {surname}", detail=None,
                value=f"P{float(value):.1f}", color=color_of(driver_id),
            )
        )

    return stats


def latest_race_summary(db: Session) -> RaceSummaryOut | None:
    race = db.execute(
        select(Race)
        .join(Result, Result.race_id == Race.id)
        .order_by(Race.date.desc())
        .limit(1)
    ).scalar_one_or_none()
    if race is None:
        return None

    podium_rows = db.execute(
        select(Result, Driver, Constructor)
        .join(Driver, Result.driver_id == Driver.id)
        .join(Constructor, Result.constructor_id == Constructor.id)
        .where(Result.race_id == race.id, Result.position <= 3)
        .order_by(Result.position)
    ).all()

    fl_row = db.execute(
        select(Driver.forename, Driver.surname, Result.fastest_lap_time)
        .join(Result, Result.driver_id == Driver.id)
        .where(Result.race_id == race.id, Result.fastest_lap_rank == 1)
        .limit(1)
    ).first()

    gain_row = db.execute(
        select(Driver.forename, Driver.surname, (Result.grid - Result.position).label("gain"))
        .join(Result, Result.driver_id == Driver.id)
        .where(Result.race_id == race.id, Result.position.isnot(None), Result.grid > 0)
        .order_by((Result.grid - Result.position).desc())
        .limit(1)
    ).first()

    pole_row = db.execute(
        select(Driver.forename, Driver.surname)
        .join(QualifyingResult, QualifyingResult.driver_id == Driver.id)
        .where(QualifyingResult.race_id == race.id, QualifyingResult.position == 1)
        .limit(1)
    ).first()

    return RaceSummaryOut(
        race_id=race.id,
        season=race.season,
        round=race.round,
        name=race.name,
        date=race.date,
        circuit=CircuitOut.model_validate(race.circuit),
        podium=[
            PodiumEntry(
                position=result.position or 0,
                driver=_driver_out(driver),
                constructor=ConstructorOut.model_validate(constructor),
                time_text=result.time_text,
            )
            for result, driver, constructor in podium_rows
        ],
        fastest_lap_driver=f"{fl_row[0]} {fl_row[1]}" if fl_row else None,
        fastest_lap_time=fl_row[2] if fl_row else None,
        biggest_gainer=f"{gain_row[0]} {gain_row[1]}" if gain_row else None,
        biggest_gain=int(gain_row[2]) if gain_row else None,
        pole_sitter=f"{pole_row[0]} {pole_row[1]}" if pole_row else None,
    )


def _driver_out(driver: Driver) -> DriverOut:
    return DriverOut(
        id=driver.id,
        driver_ref=driver.driver_ref,
        code=driver.code,
        number=driver.number,
        full_name=f"{driver.forename} {driver.surname}",
        nationality=driver.nationality,
        headshot_url=driver.headshot_url,
    )
