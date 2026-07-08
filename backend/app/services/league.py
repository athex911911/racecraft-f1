"""Prediction League: pick pole/podium/fastest-lap before a race, score it after.

Scoring is *lazy and deterministic* — whenever a completed race is read, any
un-scored predictions for it are scored from the ingested results and the points
persisted. No scheduler needed; the same inputs always yield the same points.
"""

from __future__ import annotations

from datetime import date

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.f1 import Circuit, Constructor, Driver, QualifyingResult, Race, Result
from app.models.user import Prediction, User
from app.schemas.f1 import CircuitOut, ConstructorOut
from app.schemas.league import (
    LeaderboardEntry,
    LeaderboardOut,
    LeagueDriverOption,
    LeagueRaceDetail,
    LeagueRaceItem,
    LeagueRacesOut,
    MyPredictionItem,
    MyPredictionsOut,
    PredictionPicks,
    ScoreBreakdown,
)
from app.services.dashboard import _driver_out

# scoring weights
PTS_POLE = 10
PTS_WINNER = 25
PTS_PODIUM_EXACT = 15
PTS_PODIUM_WRONG_SLOT = 5
PTS_FASTEST_LAP = 10
MAX_POINTS = PTS_POLE + PTS_WINNER + PTS_PODIUM_EXACT * 2 + PTS_FASTEST_LAP  # 75


def current_season(db: Session) -> int:
    return db.execute(select(func.max(Race.season))).scalar() or date.today().year


def _completed_ids(db: Session, race_ids: list[int]) -> set[int]:
    if not race_ids:
        return set()
    return set(
        db.execute(
            select(Result.race_id).where(Result.race_id.in_(race_ids)).distinct()
        ).scalars()
    )


def _status(race: Race, completed: set[int], today: date) -> str:
    if race.id in completed:
        return "completed"
    return "open" if race.date >= today else "awaiting"


def _actuals(db: Session, race_id: int) -> dict:
    rows = db.execute(
        select(Result.driver_id, Result.position_text, Result.fastest_lap_rank).where(
            Result.race_id == race_id
        )
    ).all()
    by_pos: dict[str, int] = {}
    fl_id: int | None = None
    for did, ptext, flr in rows:
        if ptext in ("1", "2", "3"):
            by_pos[ptext] = did
        if flr == 1:
            fl_id = did
    pole_id = db.execute(
        select(QualifyingResult.driver_id)
        .where(QualifyingResult.race_id == race_id, QualifyingResult.position == 1)
        .limit(1)
    ).scalar()
    return {
        "pole": pole_id,
        "winner": by_pos.get("1"),
        "p2": by_pos.get("2"),
        "p3": by_pos.get("3"),
        "fl": fl_id,
        "podium": {by_pos.get("1"), by_pos.get("2"), by_pos.get("3")} - {None},
    }


def _score(pred: Prediction, a: dict) -> ScoreBreakdown:
    pole = PTS_POLE if pred.pole_driver_id and pred.pole_driver_id == a["pole"] else 0
    winner = PTS_WINNER if pred.winner_driver_id and pred.winner_driver_id == a["winner"] else 0
    podium = 0
    for pick, exact in ((pred.p2_driver_id, a["p2"]), (pred.p3_driver_id, a["p3"])):
        if pick is None:
            continue
        if pick == exact:
            podium += PTS_PODIUM_EXACT
        elif pick in a["podium"]:
            podium += PTS_PODIUM_WRONG_SLOT
    fl = PTS_FASTEST_LAP if pred.fastest_lap_driver_id and pred.fastest_lap_driver_id == a["fl"] else 0
    return ScoreBreakdown(pole=pole, winner=winner, podium=podium, fastest_lap=fl,
                          total=pole + winner + podium + fl)


def _ensure_scored(db: Session) -> None:
    """Score every un-scored prediction whose race is now completed."""
    pending = db.execute(select(Prediction).where(Prediction.points.is_(None))).scalars().all()
    if not pending:
        return
    completed = _completed_ids(db, list({p.race_id for p in pending}))
    cache: dict[int, dict] = {}
    changed = False
    for p in pending:
        if p.race_id not in completed:
            continue
        a = cache.setdefault(p.race_id, _actuals(db, p.race_id))
        p.points = _score(p, a).total
        changed = True
    if changed:
        db.commit()


def _picks(pred: Prediction | None) -> PredictionPicks | None:
    if pred is None:
        return None
    return PredictionPicks(
        pole_driver_id=pred.pole_driver_id,
        winner_driver_id=pred.winner_driver_id,
        p2_driver_id=pred.p2_driver_id,
        p3_driver_id=pred.p3_driver_id,
        fastest_lap_driver_id=pred.fastest_lap_driver_id,
    )


def _race_item(race: Race, completed: set[int], today: date, pred: Prediction | None) -> LeagueRaceItem:
    return LeagueRaceItem(
        race_id=race.id,
        season=race.season,
        round=race.round,
        name=race.name,
        date=race.date,
        time=race.time,
        circuit=CircuitOut.model_validate(race.circuit),
        status=_status(race, completed, today),
        predicted=pred is not None,
        your_points=pred.points if pred else None,
    )


def _grid_options(db: Session, season: int) -> list[LeagueDriverOption]:
    """The current grid to pick from = classification of the season's latest race."""
    last_id = db.execute(
        select(Result.race_id)
        .join(Race, Result.race_id == Race.id)
        .where(Race.season == season)
        .order_by(Race.round.desc())
        .limit(1)
    ).scalar()
    if last_id is None:  # season hasn't started — fall back to the prior season
        prev = db.execute(select(func.max(Race.season)).where(Race.season < season)).scalar()
        if prev is None:
            return []
        return _grid_options(db, prev)
    rows = db.execute(
        select(Driver, Constructor)
        .join(Result, Result.driver_id == Driver.id)
        .join(Constructor, Result.constructor_id == Constructor.id)
        .where(Result.race_id == last_id)
        .order_by(Result.position_order.nulls_last())
    ).all()
    return [
        LeagueDriverOption(driver=_driver_out(d), constructor=ConstructorOut.model_validate(c))
        for d, c in rows
    ]


def _my_predictions_map(db: Session, user: User | None, race_ids: list[int]) -> dict[int, Prediction]:
    if not user or not race_ids:
        return {}
    preds = db.execute(
        select(Prediction).where(
            Prediction.user_id == user.id, Prediction.race_id.in_(race_ids)
        )
    ).scalars().all()
    return {p.race_id: p for p in preds}


def list_races(db: Session, user: User | None, season: int | None = None) -> LeagueRacesOut:
    season = season or current_season(db)
    _ensure_scored(db)
    races = db.execute(
        select(Race).join(Circuit).where(Race.season == season).order_by(Race.round)
    ).scalars().all()
    ids = [r.id for r in races]
    completed = _completed_ids(db, ids)
    mine = _my_predictions_map(db, user, ids)
    today = date.today()
    items = [_race_item(r, completed, today, mine.get(r.id)) for r in races]
    return LeagueRacesOut(season=season, max_points=MAX_POINTS, races=items)


def race_detail(db: Session, user: User | None, race_id: int) -> LeagueRaceDetail | None:
    race = db.execute(select(Race).join(Circuit).where(Race.id == race_id)).scalar_one_or_none()
    if race is None:
        return None
    _ensure_scored(db)
    completed = _completed_ids(db, [race_id])
    today = date.today()
    pred = None
    if user:
        pred = db.execute(
            select(Prediction).where(
                Prediction.user_id == user.id, Prediction.race_id == race_id
            )
        ).scalar_one_or_none()

    actual = None
    score = None
    if race_id in completed:
        a = _actuals(db, race_id)
        actual = PredictionPicks(
            pole_driver_id=a["pole"],
            winner_driver_id=a["winner"],
            p2_driver_id=a["p2"],
            p3_driver_id=a["p3"],
            fastest_lap_driver_id=a["fl"],
        )
        if pred is not None:
            score = _score(pred, a)

    return LeagueRaceDetail(
        race=_race_item(race, completed, today, pred),
        options=_grid_options(db, race.season),
        prediction=_picks(pred),
        actual=actual,
        score=score,
    )


class LeagueError(Exception):
    def __init__(self, status: int, detail: str):
        self.status = status
        self.detail = detail


def submit(db: Session, user: User, picks) -> LeagueRaceDetail:
    race = db.get(Race, picks.race_id)
    if race is None:
        raise LeagueError(404, "Race not found")
    completed = _completed_ids(db, [race.id])
    status = _status(race, completed, date.today())
    if status != "open":
        raise LeagueError(
            409,
            "This race is locked — predictions closed on race day."
            if status == "awaiting"
            else "This race is already completed.",
        )

    valid_ids = {o.driver.id for o in _grid_options(db, race.season)}
    picked = [
        picks.pole_driver_id,
        picks.winner_driver_id,
        picks.p2_driver_id,
        picks.p3_driver_id,
        picks.fastest_lap_driver_id,
    ]
    for did in picked:
        if did is not None and did not in valid_ids:
            raise LeagueError(400, "Picked driver is not on the current grid.")

    pred = db.execute(
        select(Prediction).where(
            Prediction.user_id == user.id, Prediction.race_id == race.id
        )
    ).scalar_one_or_none()
    if pred is None:
        pred = Prediction(user_id=user.id, race_id=race.id)
        db.add(pred)
    pred.pole_driver_id = picks.pole_driver_id
    pred.winner_driver_id = picks.winner_driver_id
    pred.p2_driver_id = picks.p2_driver_id
    pred.p3_driver_id = picks.p3_driver_id
    pred.fastest_lap_driver_id = picks.fastest_lap_driver_id
    pred.points = None  # not scored until the race completes
    db.commit()

    detail = race_detail(db, user, race.id)
    assert detail is not None
    return detail


def leaderboard(db: Session, user: User | None) -> LeaderboardOut:
    _ensure_scored(db)
    rows = db.execute(
        select(
            User.id,
            User.username,
            User.display_name,
            func.coalesce(func.sum(Prediction.points), 0),
            func.count(Prediction.points),
        )
        .join(Prediction, Prediction.user_id == User.id)
        .group_by(User.id)
    ).all()
    ranked = sorted(rows, key=lambda r: (-int(r[3]), -int(r[4]), r[1].lower()))
    entries: list[LeaderboardEntry] = []
    your_rank: int | None = None
    for i, (uid, uname, dname, pts, scored) in enumerate(ranked, 1):
        is_you = bool(user and uid == user.id)
        if is_you:
            your_rank = i
        entries.append(
            LeaderboardEntry(
                rank=i,
                user_id=uid,
                username=uname,
                display_name=dname,
                total_points=int(pts),
                scored=int(scored),
                is_you=is_you,
            )
        )
    return LeaderboardOut(entries=entries, your_rank=your_rank)


def my_predictions(db: Session, user: User) -> MyPredictionsOut:
    _ensure_scored(db)
    preds = db.execute(
        select(Prediction, Race)
        .join(Race, Prediction.race_id == Race.id)
        .join(Circuit, Race.circuit_id == Circuit.id)
        .where(Prediction.user_id == user.id)
        .order_by(Race.season.desc(), Race.round.desc())
    ).all()
    ids = [r.id for _, r in preds]
    completed = _completed_ids(db, ids)
    today = date.today()
    items: list[MyPredictionItem] = []
    total = 0
    scored = 0
    for pred, race in preds:
        sb = None
        if race.id in completed:
            sb = _score(pred, _actuals(db, race.id))
            total += sb.total
            scored += 1
        items.append(
            MyPredictionItem(
                race=_race_item(race, completed, today, pred),
                picks=_picks(pred),
                score=sb,
            )
        )
    return MyPredictionsOut(total_points=total, scored=scored, items=items)
