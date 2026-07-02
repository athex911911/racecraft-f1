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
from seed_data import CIRCUIT_META, FALLBACK_TEAM_COLOR, TEAM_COLORS  # noqa: E402

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
log = logging.getLogger("seed")


def main() -> None:
    Base.metadata.create_all(engine)
    db = SessionLocal()
    try:
        teams = db.execute(select(Constructor)).scalars().all()
        for team in teams:
            team.color = TEAM_COLORS.get(team.constructor_ref, FALLBACK_TEAM_COLOR)
        log.info("colored %d constructors", len(teams))

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
