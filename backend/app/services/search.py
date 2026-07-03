"""Global search across drivers, constructors and circuits."""

from __future__ import annotations

from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session

from app.models.f1 import Circuit, Constructor, Driver, Result
from app.schemas.f1 import (
    SearchCircuit,
    SearchConstructor,
    SearchDriver,
    SearchOut,
)

PER_KIND = 6


def search(db: Session, query: str) -> SearchOut:
    q = query.strip()
    if len(q) < 2:
        return SearchOut(drivers=[], constructors=[], circuits=[])
    like = f"%{q.lower()}%"

    # drivers — most-raced first so typing "ver" surfaces Verstappen, not an obscure namesake
    race_counts = (
        select(Result.driver_id, func.count(func.distinct(Result.race_id)).label("n"))
        .group_by(Result.driver_id)
        .subquery()
    )
    full_name = func.lower(Driver.forename + " " + Driver.surname)
    driver_rows = db.execute(
        select(Driver)
        .outerjoin(race_counts, race_counts.c.driver_id == Driver.id)
        .where(
            or_(
                full_name.like(like),
                func.lower(Driver.surname).like(like),
                func.lower(Driver.forename).like(like),
                func.lower(Driver.code).like(like),
            )
        )
        .order_by(func.coalesce(race_counts.c.n, 0).desc(), Driver.surname)
        .limit(PER_KIND)
    ).scalars().all()

    constructor_rows = db.execute(
        select(Constructor)
        .where(func.lower(Constructor.name).like(like))
        .order_by(Constructor.name)
        .limit(PER_KIND)
    ).scalars().all()

    circuit_rows = db.execute(
        select(Circuit)
        .where(
            or_(
                func.lower(Circuit.name).like(like),
                func.lower(Circuit.location).like(like),
                func.lower(Circuit.country).like(like),
            )
        )
        .order_by(Circuit.name)
        .limit(PER_KIND)
    ).scalars().all()

    return SearchOut(
        drivers=[
            SearchDriver(
                ref=d.driver_ref,
                name=f"{d.forename} {d.surname}",
                code=d.code,
                nationality=d.nationality,
                headshot_url=d.headshot_url,
            )
            for d in driver_rows
        ],
        constructors=[
            SearchConstructor(ref=c.constructor_ref, name=c.name, color=c.color, logo_url=c.logo_url)
            for c in constructor_rows
        ],
        circuits=[
            SearchCircuit(ref=c.circuit_ref, name=c.name, location=c.location, country=c.country)
            for c in circuit_rows
        ],
    )
