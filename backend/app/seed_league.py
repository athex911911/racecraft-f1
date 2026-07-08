"""Seed demo Prediction-League accounts + historical picks so the leaderboard is
populated for a demo. Clearly synthetic sample data. Idempotent — skips a user
who already has predictions.

    cd backend && .venv/Scripts/python.exe -m app.seed_league
"""

import random

from sqlalchemy import select

from app.core.database import SessionLocal
from app.core.security import hash_password
from app.models.f1 import Race, Result
from app.models.user import Prediction, User
from app.services import league as lg

DEMO_PW = "demopass123"
# (username, display name, skill = P(picks the correct driver per slot))
DEMO_USERS = [
    ("verstappen_fan", "Max Backer", 0.80),
    ("apex_hunter", "Apex Hunter", 0.68),
    ("tifosi_88", "Rosso Corsa", 0.60),
    ("grid_walker", "Grid Walker", 0.50),
    ("box_box_box", "Undercut Udo", 0.42),
]


def _pool(db, race_id: int) -> list[int]:
    return [did for (did,) in db.execute(select(Result.driver_id).where(Result.race_id == race_id))]


def _pick(rng, correct, pool, skill):
    if correct is not None and rng.random() < skill:
        return correct
    return rng.choice(pool) if pool else correct


def _seed_user(db, rng, user: User, races, skill: float) -> None:
    for r in races:
        a = lg._actuals(db, r.id)
        pool = _pool(db, r.id) or [a["winner"]]
        db.add(
            Prediction(
                user_id=user.id,
                race_id=r.id,
                pole_driver_id=_pick(rng, a["pole"], pool, skill),
                winner_driver_id=_pick(rng, a["winner"], pool, skill),
                p2_driver_id=_pick(rng, a["p2"], pool, skill),
                p3_driver_id=_pick(rng, a["p3"], pool, skill),
                fastest_lap_driver_id=_pick(rng, a["fl"], pool, skill),
            )
        )
    db.commit()


def main() -> None:
    db = SessionLocal()
    season = lg.current_season(db)
    races = db.execute(select(Race).where(Race.season == season).order_by(Race.round)).scalars().all()
    completed_ids = lg._completed_ids(db, [r.id for r in races])
    completed = [r for r in races if r.id in completed_ids]
    if not completed:
        print("No completed races in the current season — nothing to seed.")
        return

    rng = random.Random(2026)
    for uname, dname, skill in DEMO_USERS:
        user = db.execute(select(User).where(User.username == uname)).scalar_one_or_none()
        if user and db.execute(select(Prediction).where(Prediction.user_id == user.id)).first():
            print(f"skip {uname} (already seeded)")
            continue
        if user is None:
            user = User(
                username=uname,
                email=f"{uname}@demo.f1ai",
                hashed_password=hash_password(DEMO_PW),
                display_name=dname,
            )
            db.add(user)
            db.commit()
            db.refresh(user)
        _seed_user(db, rng, user, completed, skill)
        print(f"seeded {uname} ({len(completed)} picks)")

    # give the real athex account some scored history too
    athex = db.execute(select(User).where(User.username == "athex")).scalar_one_or_none()
    if athex:
        todo = [r for r in completed
                if not db.execute(
                    select(Prediction).where(
                        Prediction.user_id == athex.id, Prediction.race_id == r.id
                    )
                ).first()]
        if todo:
            _seed_user(db, rng, athex, todo, 0.72)
            print(f"seeded athex ({len(todo)} picks)")

    lg._ensure_scored(db)
    lb = lg.leaderboard(db, None)
    print("\nLeaderboard:")
    for e in lb.entries:
        print(f"  {e.rank}. {e.display_name or e.username:<16} {e.total_points:>4} pts  ({e.scored} scored)")
    db.close()


if __name__ == "__main__":
    main()
