"""Resumable Jolpica -> PostgreSQL ingester.

Usage (from repo root, backend venv active):
    python pipeline/ingest/ingest.py --from-season 2024 --to-season 2026
    python pipeline/ingest/ingest.py --from-season 1950 --to-season 2009 --slow

Already-completed (entity, season) chunks are recorded in ingest_checkpoints
and skipped, so the script can be stopped and rerun at any time.
"""

import argparse
import logging
import sys
from datetime import date, datetime, timezone
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(REPO_ROOT / "backend"))

from sqlalchemy import select  # noqa: E402
from sqlalchemy.orm import Session  # noqa: E402

from app.core.database import Base, SessionLocal, engine  # noqa: E402
from app.models.f1 import (  # noqa: E402
    Circuit,
    Constructor,
    ConstructorStanding,
    Driver,
    DriverStanding,
    IngestCheckpoint,
    QualifyingResult,
    Race,
    Result,
    SprintResult,
)
from jolpica import JolpicaClient  # noqa: E402

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
log = logging.getLogger("ingest")


def parse_date(s: str | None) -> date | None:
    return date.fromisoformat(s) if s else None


def parse_session_dt(node: dict | None) -> datetime | None:
    if not node or "date" not in node:
        return None
    time_part = (node.get("time") or "00:00:00Z").replace("Z", "")
    return datetime.fromisoformat(f"{node['date']}T{time_part}")


def parse_int(v) -> int | None:
    try:
        return int(v)
    except (TypeError, ValueError):
        return None


def parse_float(v) -> float | None:
    try:
        return float(v)
    except (TypeError, ValueError):
        return None


class Ingester:
    def __init__(self, db: Session, client: JolpicaClient):
        self.db = db
        self.client = client
        self._circuit_cache: dict[str, int] = {}
        self._driver_cache: dict[str, int] = {}
        self._constructor_cache: dict[str, int] = {}
        self._race_cache: dict[tuple[int, int], int] = {}

    # ---------- checkpoints ----------

    def done(self, entity: str, season: int = 0) -> bool:
        return (
            self.db.execute(
                select(IngestCheckpoint).filter_by(entity=entity, season=season)
            ).scalar_one_or_none()
            is not None
        )

    def mark_done(self, entity: str, season: int = 0) -> None:
        self.db.add(
            IngestCheckpoint(entity=entity, season=season, completed_at=datetime.now(timezone.utc))
        )
        self.db.commit()

    # ---------- reference entities ----------

    def upsert_circuit(self, node: dict) -> int:
        ref = node["circuitId"]
        if ref in self._circuit_cache:
            return self._circuit_cache[ref]
        row = self.db.execute(select(Circuit).filter_by(circuit_ref=ref)).scalar_one_or_none()
        if row is None:
            loc = node.get("Location", {})
            row = Circuit(
                circuit_ref=ref,
                name=node.get("circuitName", ref),
                location=loc.get("locality"),
                country=loc.get("country"),
                lat=parse_float(loc.get("lat")),
                lng=parse_float(loc.get("long")),
                url=node.get("url"),
            )
            self.db.add(row)
            self.db.flush()
        self._circuit_cache[ref] = row.id
        return row.id

    def upsert_driver(self, node: dict) -> int:
        ref = node["driverId"]
        if ref in self._driver_cache:
            return self._driver_cache[ref]
        row = self.db.execute(select(Driver).filter_by(driver_ref=ref)).scalar_one_or_none()
        if row is None:
            row = Driver(
                driver_ref=ref,
                number=parse_int(node.get("permanentNumber")),
                code=node.get("code"),
                forename=node.get("givenName", ""),
                surname=node.get("familyName", ""),
                dob=parse_date(node.get("dateOfBirth")),
                nationality=node.get("nationality"),
                url=node.get("url"),
            )
            self.db.add(row)
            self.db.flush()
        self._driver_cache[ref] = row.id
        return row.id

    def upsert_constructor(self, node: dict) -> int:
        ref = node["constructorId"]
        if ref in self._constructor_cache:
            return self._constructor_cache[ref]
        row = self.db.execute(select(Constructor).filter_by(constructor_ref=ref)).scalar_one_or_none()
        if row is None:
            row = Constructor(
                constructor_ref=ref,
                name=node.get("name", ref),
                nationality=node.get("nationality"),
                url=node.get("url"),
            )
            self.db.add(row)
            self.db.flush()
        self._constructor_cache[ref] = row.id
        return row.id

    def race_id(self, season: int, rnd: int) -> int | None:
        key = (season, rnd)
        if key not in self._race_cache:
            row = self.db.execute(select(Race).filter_by(season=season, round=rnd)).scalar_one_or_none()
            if row is None:
                return None
            self._race_cache[key] = row.id
        return self._race_cache[key]

    # ---------- season-independent entities ----------

    def ingest_circuits(self) -> None:
        if self.done("circuits"):
            return
        n = 0
        for node in self.client.get_paged("circuits/", "CircuitTable", "Circuits"):
            self.upsert_circuit(node)
            n += 1
        self.db.commit()
        self.mark_done("circuits")
        log.info("circuits: %d", n)

    def ingest_drivers(self) -> None:
        if self.done("drivers"):
            return
        n = 0
        for node in self.client.get_paged("drivers/", "DriverTable", "Drivers"):
            self.upsert_driver(node)
            n += 1
        self.db.commit()
        self.mark_done("drivers")
        log.info("drivers: %d", n)

    def ingest_constructors(self) -> None:
        if self.done("constructors"):
            return
        n = 0
        for node in self.client.get_paged("constructors/", "ConstructorTable", "Constructors"):
            self.upsert_constructor(node)
            n += 1
        self.db.commit()
        self.mark_done("constructors")
        log.info("constructors: %d", n)

    # ---------- per-season entities ----------

    def ingest_races(self, season: int) -> None:
        if self.done("races", season):
            return
        n = 0
        for node in self.client.get_paged(f"{season}/races/", "RaceTable", "Races"):
            rnd = int(node["round"])
            circuit_id = self.upsert_circuit(node["Circuit"])
            row = self.db.execute(select(Race).filter_by(season=season, round=rnd)).scalar_one_or_none()
            if row is None:
                row = Race(season=season, round=rnd, circuit_id=circuit_id, name="", date=date.min)
                self.db.add(row)
            row.name = node.get("raceName", "")
            row.date = parse_date(node.get("date")) or date.min
            row.time = (node.get("time") or "").replace("Z", "") or None
            row.url = node.get("url")
            row.circuit_id = circuit_id
            row.fp1 = parse_session_dt(node.get("FirstPractice"))
            row.fp2 = parse_session_dt(node.get("SecondPractice"))
            row.fp3 = parse_session_dt(node.get("ThirdPractice"))
            row.qualifying = parse_session_dt(node.get("Qualifying"))
            row.sprint = parse_session_dt(node.get("Sprint"))
            n += 1
        self.db.commit()
        self.mark_done("races", season)
        log.info("races %d: %d", season, n)

    def ingest_results(self, season: int) -> None:
        if self.done("results", season):
            return
        n = 0
        for race_node in self.client.get_paged(f"{season}/results/", "RaceTable", "Races"):
            rid = self.race_id(season, int(race_node["round"]))
            if rid is None:
                continue
            for res in race_node.get("Results", []):
                driver_id = self.upsert_driver(res["Driver"])
                constructor_id = self.upsert_constructor(res["Constructor"])
                row = self.db.execute(
                    select(Result).filter_by(race_id=rid, driver_id=driver_id)
                ).scalar_one_or_none()
                if row is None:
                    row = Result(race_id=rid, driver_id=driver_id, constructor_id=constructor_id)
                    self.db.add(row)
                row.constructor_id = constructor_id
                row.grid = parse_int(res.get("grid"))
                row.position = parse_int(res.get("position"))
                row.position_text = res.get("positionText")
                row.points = parse_float(res.get("points")) or 0.0
                row.laps = parse_int(res.get("laps"))
                row.status = res.get("status")
                t = res.get("Time") or {}
                row.time_text = t.get("time")
                row.milliseconds = parse_int(t.get("millis"))
                fl = res.get("FastestLap") or {}
                row.fastest_lap = parse_int(fl.get("lap"))
                row.fastest_lap_rank = parse_int(fl.get("rank"))
                row.fastest_lap_time = (fl.get("Time") or {}).get("time")
                row.fastest_lap_speed = parse_float((fl.get("AverageSpeed") or {}).get("speed"))
                n += 1
            self.db.commit()
        self.mark_done("results", season)
        log.info("results %d: %d", season, n)

    def ingest_qualifying(self, season: int) -> None:
        if self.done("qualifying", season):
            return
        n = 0
        for race_node in self.client.get_paged(f"{season}/qualifying/", "RaceTable", "Races"):
            rid = self.race_id(season, int(race_node["round"]))
            if rid is None:
                continue
            for q in race_node.get("QualifyingResults", []):
                driver_id = self.upsert_driver(q["Driver"])
                constructor_id = self.upsert_constructor(q["Constructor"])
                row = self.db.execute(
                    select(QualifyingResult).filter_by(race_id=rid, driver_id=driver_id)
                ).scalar_one_or_none()
                if row is None:
                    row = QualifyingResult(race_id=rid, driver_id=driver_id, constructor_id=constructor_id)
                    self.db.add(row)
                row.constructor_id = constructor_id
                row.position = parse_int(q.get("position"))
                row.q1, row.q2, row.q3 = q.get("Q1"), q.get("Q2"), q.get("Q3")
                n += 1
            self.db.commit()
        self.mark_done("qualifying", season)
        log.info("qualifying %d: %d", season, n)

    def ingest_sprints(self, season: int) -> None:
        if season < 2021 or self.done("sprint", season):
            return
        n = 0
        for race_node in self.client.get_paged(f"{season}/sprint/", "RaceTable", "Races"):
            rid = self.race_id(season, int(race_node["round"]))
            if rid is None:
                continue
            for res in race_node.get("SprintResults", []):
                driver_id = self.upsert_driver(res["Driver"])
                constructor_id = self.upsert_constructor(res["Constructor"])
                row = self.db.execute(
                    select(SprintResult).filter_by(race_id=rid, driver_id=driver_id)
                ).scalar_one_or_none()
                if row is None:
                    row = SprintResult(race_id=rid, driver_id=driver_id, constructor_id=constructor_id)
                    self.db.add(row)
                row.constructor_id = constructor_id
                row.grid = parse_int(res.get("grid"))
                row.position = parse_int(res.get("position"))
                row.position_text = res.get("positionText")
                row.points = parse_float(res.get("points")) or 0.0
                row.laps = parse_int(res.get("laps"))
                row.status = res.get("status")
                n += 1
            self.db.commit()
        self.mark_done("sprint", season)
        log.info("sprint %d: %d", season, n)

    def ingest_final_standings(self, season: int) -> None:
        """Season-end standings, stored against the season's last completed race."""
        if self.done("standings_final", season):
            return
        data = self.client.get(f"{season}/driverStandings/", {"limit": 100})
        lists = data.get("StandingsTable", {}).get("StandingsLists", [])
        if not lists:
            self.mark_done("standings_final", season)
            return
        rnd = int(lists[0]["round"])
        rid = self.race_id(season, rnd)
        if rid is not None:
            self._store_driver_standings(rid, lists[0].get("DriverStandings", []))
        cdata = self.client.get(f"{season}/constructorStandings/", {"limit": 100})
        clists = cdata.get("StandingsTable", {}).get("StandingsLists", [])
        if clists and rid is not None:
            self._store_constructor_standings(rid, clists[0].get("ConstructorStandings", []))
        self.db.commit()
        self.mark_done("standings_final", season)
        log.info("final standings %d (round %d)", season, rnd)

    def ingest_round_standings(self, season: int) -> None:
        """Per-round standings for the championship-progress chart (current season)."""
        races = self.db.execute(
            select(Race).filter(Race.season == season, Race.date <= date.today()).order_by(Race.round)
        ).scalars().all()
        for race in races:
            key = f"standings_round_{race.round}"
            if self.done(key, season):
                continue
            data = self.client.get(f"{season}/{race.round}/driverStandings/", {"limit": 100})
            lists = data.get("StandingsTable", {}).get("StandingsLists", [])
            if lists:
                self._store_driver_standings(race.id, lists[0].get("DriverStandings", []))
            cdata = self.client.get(f"{season}/{race.round}/constructorStandings/", {"limit": 100})
            clists = cdata.get("StandingsTable", {}).get("StandingsLists", [])
            if clists:
                self._store_constructor_standings(race.id, clists[0].get("ConstructorStandings", []))
            self.db.commit()
            self.mark_done(key, season)
            log.info("round standings %d r%d", season, race.round)

    def _store_driver_standings(self, race_id: int, nodes: list[dict]) -> None:
        for s in nodes:
            driver_id = self.upsert_driver(s["Driver"])
            row = self.db.execute(
                select(DriverStanding).filter_by(race_id=race_id, driver_id=driver_id)
            ).scalar_one_or_none()
            if row is None:
                row = DriverStanding(race_id=race_id, driver_id=driver_id)
                self.db.add(row)
            row.points = parse_float(s.get("points")) or 0.0
            row.position = parse_int(s.get("position"))
            row.wins = parse_int(s.get("wins")) or 0

    def _store_constructor_standings(self, race_id: int, nodes: list[dict]) -> None:
        for s in nodes:
            constructor_id = self.upsert_constructor(s["Constructor"])
            row = self.db.execute(
                select(ConstructorStanding).filter_by(race_id=race_id, constructor_id=constructor_id)
            ).scalar_one_or_none()
            if row is None:
                row = ConstructorStanding(race_id=race_id, constructor_id=constructor_id)
                self.db.add(row)
            row.points = parse_float(s.get("points")) or 0.0
            row.position = parse_int(s.get("position"))
            row.wins = parse_int(s.get("wins")) or 0


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--from-season", type=int, default=2024)
    parser.add_argument("--to-season", type=int, default=date.today().year)
    parser.add_argument("--slow", action="store_true", help="pace for the 500 req/hr sustained cap")
    parser.add_argument("--current-season-standings", action="store_true",
                        help="also fetch per-round standings for the latest season")
    args = parser.parse_args()

    Base.metadata.create_all(engine)
    client = JolpicaClient(min_interval=7.5 if args.slow else 3.8)
    db = SessionLocal()
    ing = Ingester(db, client)
    try:
        ing.ingest_circuits()
        ing.ingest_drivers()
        ing.ingest_constructors()
        seasons = range(args.to_season, args.from_season - 1, -1)  # newest first
        for season in seasons:
            ing.ingest_races(season)
            ing.ingest_results(season)
            ing.ingest_qualifying(season)
            ing.ingest_sprints(season)
            ing.ingest_final_standings(season)
        if args.current_season_standings:
            ing.ingest_round_standings(args.to_season)
        log.info("ingest complete")
    finally:
        db.close()
        client.close()


if __name__ == "__main__":
    main()
