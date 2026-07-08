"""Create any missing tables (idempotent). Run after adding new models.

    cd backend && .venv/Scripts/python.exe -m app.init_db

No Alembic in the app — create_all only adds tables that don't exist yet, so it
never touches the ingested F1 data.
"""

from app.core.database import Base, engine
from app.models import f1, user  # noqa: F401  (import registers every table on Base)


def main() -> None:
    before = set(Base.metadata.tables)
    Base.metadata.create_all(engine)
    print(f"Ensured {len(before)} tables:")
    for name in sorted(before):
        print(f"  - {name}")


if __name__ == "__main__":
    main()
