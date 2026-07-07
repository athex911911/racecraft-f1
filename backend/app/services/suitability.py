"""Track suitability: rank the current grid by how well each driver fits a
circuit, blending their record *here*, their record at *similar* circuits
(same track type) and their *current form*.

Pure reads over ingested results — no model artifacts, no external data. The
score is relative to the current grid, so it answers "who's best suited to
this track, right now?" rather than all-time greatness.
"""

from __future__ import annotations

from collections import defaultdict
from statistics import mean

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.f1 import Circuit, Constructor, Driver, Race, Result
from app.schemas.f1 import ConstructorOut, SuitabilityEntry, SuitabilityOut
from app.services.dashboard import _driver_out

SINCE = 2016  # keep the era relevant to the current grid + points system
FORM_RACES = 10


def track_suitability(db: Session, circuit_ref: str) -> SuitabilityOut | None:
    circuit = db.execute(
        select(Circuit).where(Circuit.circuit_ref == circuit_ref)
    ).scalar_one_or_none()
    if circuit is None:
        return None
    ttype = circuit.track_type

    latest = db.execute(select(func.max(Race.season))).scalar()
    if latest is None:
        return None

    # current grid: each driver's most recent constructor in the latest season
    grid: dict[int, int] = {}
    for did, cid, _ in db.execute(
        select(Result.driver_id, Result.constructor_id, Race.date)
        .join(Race, Race.id == Result.race_id)
        .where(Race.season == latest)
        .order_by(Race.date)
    ).all():
        grid[did] = cid
    driver_ids = list(grid)
    if not driver_ids:
        return None

    # every result these drivers have posted in the relevant era
    rows = db.execute(
        select(
            Result.driver_id,
            Result.points,
            Result.position,
            Race.date,
            Circuit.circuit_ref,
            Circuit.track_type,
        )
        .join(Race, Race.id == Result.race_id)
        .join(Circuit, Circuit.id == Race.circuit_id)
        .where(Result.driver_id.in_(driver_ids), Race.season >= SINCE)
    ).all()

    per: dict[int, list] = defaultdict(list)
    for did, pts, pos, dt, cref, ctype in rows:
        per[did].append((pts or 0.0, pos, dt, cref, ctype))

    # per-driver components
    comp: dict[int, dict] = {}
    for did in driver_ids:
        recs = per.get(did, [])
        here = [r for r in recs if r[3] == circuit_ref]
        similar = [r for r in recs if ttype and r[4] == ttype and r[3] != circuit_ref]
        recent = sorted(recs, key=lambda r: r[2], reverse=True)[:FORM_RACES]
        finishes = [r[1] for r in here if r[1] is not None]
        comp[did] = {
            "here_ppr": mean(r[0] for r in here) if here else 0.0,
            "similar_ppr": mean(r[0] for r in similar) if similar else None,
            "form_ppr": mean(r[0] for r in recent) if recent else 0.0,
            "here_starts": len(here),
            "here_best": min(finishes) if finishes else None,
        }

    max_here = max((c["here_ppr"] for c in comp.values()), default=0.0) or 1.0
    max_sim = max(
        (c["similar_ppr"] for c in comp.values() if c["similar_ppr"] is not None),
        default=0.0,
    ) or 1.0
    max_form = max((c["form_ppr"] for c in comp.values()), default=0.0) or 1.0

    scored: list[tuple[int, float, dict]] = []
    for did in driver_ids:
        c = comp[did]
        hn = c["here_ppr"] / max_here
        sn = c["similar_ppr"] / max_sim if c["similar_ppr"] is not None else None
        fn = c["form_ppr"] / max_form
        if c["here_starts"] >= 1 and sn is not None:
            contribs = {"here": 0.45 * hn, "similar": 0.25 * sn, "form": 0.30 * fn}
        elif sn is not None:  # never raced here
            contribs = {"similar": 0.55 * sn, "form": 0.45 * fn}
        elif c["here_starts"] >= 1:  # circuit has no track_type peers
            contribs = {"here": 0.6 * hn, "form": 0.4 * fn}
        else:
            contribs = {"form": fn}
        score = sum(contribs.values()) * 100
        dominant = max(contribs, key=contribs.get)
        scored.append((did, score, {**c, "dominant": dominant}))

    scored.sort(key=lambda x: x[1], reverse=True)

    drivers = {
        d.id: d
        for d in db.execute(select(Driver).where(Driver.id.in_(driver_ids))).scalars()
    }
    cons = {
        c.id: c
        for c in db.execute(
            select(Constructor).where(Constructor.id.in_(set(grid.values())))
        ).scalars()
    }

    entries = [
        SuitabilityEntry(
            driver=_driver_out(drivers[did]),
            constructor=(
                ConstructorOut.model_validate(cons[grid[did]]) if grid[did] in cons else None
            ),
            score=round(score, 1),
            here_starts=c["here_starts"],
            here_best=c["here_best"],
            reason=_reason(c, ttype),
        )
        for did, score, c in scored
        if did in drivers
    ]

    return SuitabilityOut(circuit_ref=circuit_ref, track_type=ttype, entries=entries)


def _reason(c: dict, ttype: str | None) -> str:
    if c["here_starts"] == 0:
        if c["dominant"] == "similar" and ttype:
            return f"No starts here · suits {ttype} tracks"
        return "No starts here · judged on form"
    if c["here_best"] == 1:
        return f"Won here · {c['here_starts']} starts"
    if c["here_best"] is not None and c["here_best"] <= 3:
        return f"Podium here · best P{c['here_best']}"
    if c["dominant"] == "here":
        return f"Consistent here · {c['here_starts']} starts"
    if c["dominant"] == "similar" and ttype:
        return f"Suits {ttype} circuits"
    return "Strong current form"
