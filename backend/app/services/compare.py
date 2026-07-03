"""Driver vs driver head-to-head (powers the Compare page)."""

from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.f1 import Driver, QualifyingResult, Race, Result
from app.schemas.f1 import CompareOut, HeadToHead
from app.services.drivers import _finish_pos, driver_detail


def _finishes_by_race(db: Session, driver_id: int) -> dict[int, int | None]:
    rows = db.execute(
        select(Result.race_id, Result.position_text).where(Result.driver_id == driver_id)
    ).all()
    return {rid: _finish_pos(pt) for rid, pt in rows}


def _quali_by_race(db: Session, driver_id: int) -> dict[int, int | None]:
    rows = db.execute(
        select(QualifyingResult.race_id, QualifyingResult.position).where(
            QualifyingResult.driver_id == driver_id
        )
    ).all()
    return {rid: pos for rid, pos in rows}


def compare_drivers(db: Session, ref_a: str, ref_b: str) -> CompareOut | None:
    detail_a = driver_detail(db, ref_a)
    detail_b = driver_detail(db, ref_b)
    if detail_a is None or detail_b is None:
        return None

    id_a = detail_a.driver.id
    id_b = detail_b.driver.id

    fin_a = _finishes_by_race(db, id_a)
    fin_b = _finishes_by_race(db, id_b)
    shared = set(fin_a) & set(fin_b)
    a_race_ahead = b_race_ahead = 0
    for rid in shared:
        pa, pb = fin_a[rid], fin_b[rid]
        if pa is not None and pb is not None:
            if pa < pb:
                a_race_ahead += 1
            elif pb < pa:
                b_race_ahead += 1

    q_a = _quali_by_race(db, id_a)
    q_b = _quali_by_race(db, id_b)
    a_quali_ahead = b_quali_ahead = 0
    for rid in set(q_a) & set(q_b):
        pa, pb = q_a[rid], q_b[rid]
        if pa is not None and pb is not None:
            if pa < pb:
                a_quali_ahead += 1
            elif pb < pa:
                b_quali_ahead += 1

    return CompareOut(
        a=detail_a,
        b=detail_b,
        head_to_head=HeadToHead(
            shared_races=len(shared),
            a_race_ahead=a_race_ahead,
            b_race_ahead=b_race_ahead,
            a_quali_ahead=a_quali_ahead,
            b_quali_ahead=b_quali_ahead,
        ),
    )
