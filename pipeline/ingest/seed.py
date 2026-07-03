"""Apply curated seed data (team colors, circuit metadata) to already-ingested rows.
Safe to rerun any time; only fills/refreshes curated columns."""

import logging
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(REPO_ROOT / "backend"))

from sqlalchemy import select  # noqa: E402

from app.core.database import Base, SessionLocal, engine  # noqa: E402
from app.models.f1 import Circuit, Constructor  # noqa: E402
from seed_data import CIRCUIT_META, FALLBACK_TEAM_COLOR, TEAM_COLORS, TEAM_LOGOS  # noqa: E402

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
log = logging.getLogger("seed")


def main() -> None:
    Base.metadata.create_all(engine)
    db = SessionLocal()
    try:
        teams = db.execute(select(Constructor)).scalars().all()
        logos = 0
        for team in teams:
            team.color = TEAM_COLORS.get(team.constructor_ref, FALLBACK_TEAM_COLOR)
            if team.constructor_ref in TEAM_LOGOS:  # curated logo wins over auto-fetch
                team.logo_url = TEAM_LOGOS[team.constructor_ref]
                logos += 1
        log.info("colored %d constructors, set %d curated logos", len(teams), logos)

        matched = 0
        for circuit in db.execute(select(Circuit)).scalars().all():
            meta = CIRCUIT_META.get(circuit.circuit_ref)
            if not meta:
                continue
            for key, value in meta.items():
                setattr(circuit, key, value)
            matched += 1
        log.info("applied metadata to %d circuits", matched)
        db.commit()
    finally:
        db.close()


if __name__ == "__main__":
    main()
