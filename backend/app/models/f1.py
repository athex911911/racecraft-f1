from datetime import date, datetime

from sqlalchemy import (
    BigInteger,
    Date,
    DateTime,
    Float,
    ForeignKey,
    Index,
    Integer,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class Circuit(Base):
    __tablename__ = "circuits"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    circuit_ref: Mapped[str] = mapped_column(String(64), unique=True, index=True)
    name: Mapped[str] = mapped_column(String(128))
    location: Mapped[str | None] = mapped_column(String(128))
    country: Mapped[str | None] = mapped_column(String(64))
    lat: Mapped[float | None] = mapped_column(Float)
    lng: Mapped[float | None] = mapped_column(Float)
    url: Mapped[str | None] = mapped_column(Text)

    # Curated metadata (seeded from static data, not the API)
    length_km: Mapped[float | None] = mapped_column(Float)
    corners: Mapped[int | None] = mapped_column(Integer)
    drs_zones: Mapped[int | None] = mapped_column(Integer)
    track_type: Mapped[str | None] = mapped_column(String(32))  # street | permanent | hybrid
    first_gp_year: Mapped[int | None] = mapped_column(Integer)
    lap_record_time: Mapped[str | None] = mapped_column(String(16))
    lap_record_driver: Mapped[str | None] = mapped_column(String(64))
    lap_record_year: Mapped[int | None] = mapped_column(Integer)

    races: Mapped[list["Race"]] = relationship(back_populates="circuit")


class Driver(Base):
    __tablename__ = "drivers"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    driver_ref: Mapped[str] = mapped_column(String(64), unique=True, index=True)
    number: Mapped[int | None] = mapped_column(Integer)
    code: Mapped[str | None] = mapped_column(String(8))
    forename: Mapped[str] = mapped_column(String(64))
    surname: Mapped[str] = mapped_column(String(64))
    dob: Mapped[date | None] = mapped_column(Date)
    nationality: Mapped[str | None] = mapped_column(String(64))
    url: Mapped[str | None] = mapped_column(Text)
    headshot_url: Mapped[str | None] = mapped_column(Text)

    results: Mapped[list["Result"]] = relationship(back_populates="driver")

    @property
    def full_name(self) -> str:
        return f"{self.forename} {self.surname}"


class Constructor(Base):
    __tablename__ = "constructors"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    constructor_ref: Mapped[str] = mapped_column(String(64), unique=True, index=True)
    name: Mapped[str] = mapped_column(String(128))
    nationality: Mapped[str | None] = mapped_column(String(64))
    url: Mapped[str | None] = mapped_column(Text)
    color: Mapped[str | None] = mapped_column(String(9))  # hex team color, curated
    logo_url: Mapped[str | None] = mapped_column(Text)

    results: Mapped[list["Result"]] = relationship(back_populates="constructor")


class Race(Base):
    __tablename__ = "races"
    __table_args__ = (UniqueConstraint("season", "round", name="uq_race_season_round"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    season: Mapped[int] = mapped_column(Integer, index=True)
    round: Mapped[int] = mapped_column(Integer)
    circuit_id: Mapped[int] = mapped_column(ForeignKey("circuits.id"))
    name: Mapped[str] = mapped_column(String(128))
    date: Mapped[date] = mapped_column(Date, index=True)
    time: Mapped[str | None] = mapped_column(String(16))
    url: Mapped[str | None] = mapped_column(Text)

    fp1: Mapped[datetime | None] = mapped_column(DateTime)
    fp2: Mapped[datetime | None] = mapped_column(DateTime)
    fp3: Mapped[datetime | None] = mapped_column(DateTime)
    qualifying: Mapped[datetime | None] = mapped_column(DateTime)
    sprint: Mapped[datetime | None] = mapped_column(DateTime)

    circuit: Mapped["Circuit"] = relationship(back_populates="races")
    results: Mapped[list["Result"]] = relationship(back_populates="race")


class Result(Base):
    __tablename__ = "results"
    __table_args__ = (
        UniqueConstraint("race_id", "driver_id", name="uq_result_race_driver"),
        Index("ix_results_driver_race", "driver_id", "race_id"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    race_id: Mapped[int] = mapped_column(ForeignKey("races.id"), index=True)
    driver_id: Mapped[int] = mapped_column(ForeignKey("drivers.id"), index=True)
    constructor_id: Mapped[int] = mapped_column(ForeignKey("constructors.id"), index=True)
    grid: Mapped[int | None] = mapped_column(Integer)
    position: Mapped[int | None] = mapped_column(Integer)  # null when not classified
    position_text: Mapped[str | None] = mapped_column(String(8))  # "R", "D", "W", or number
    position_order: Mapped[int | None] = mapped_column(Integer)
    points: Mapped[float] = mapped_column(Float, default=0.0)
    laps: Mapped[int | None] = mapped_column(Integer)
    time_text: Mapped[str | None] = mapped_column(String(32))
    milliseconds: Mapped[int | None] = mapped_column(BigInteger)
    fastest_lap: Mapped[int | None] = mapped_column(Integer)
    fastest_lap_rank: Mapped[int | None] = mapped_column(Integer)
    fastest_lap_time: Mapped[str | None] = mapped_column(String(16))
    fastest_lap_speed: Mapped[float | None] = mapped_column(Float)
    status: Mapped[str | None] = mapped_column(String(64))

    race: Mapped["Race"] = relationship(back_populates="results")
    driver: Mapped["Driver"] = relationship(back_populates="results")
    constructor: Mapped["Constructor"] = relationship(back_populates="results")


class SprintResult(Base):
    __tablename__ = "sprint_results"
    __table_args__ = (UniqueConstraint("race_id", "driver_id", name="uq_sprint_race_driver"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    race_id: Mapped[int] = mapped_column(ForeignKey("races.id"), index=True)
    driver_id: Mapped[int] = mapped_column(ForeignKey("drivers.id"), index=True)
    constructor_id: Mapped[int] = mapped_column(ForeignKey("constructors.id"))
    grid: Mapped[int | None] = mapped_column(Integer)
    position: Mapped[int | None] = mapped_column(Integer)
    position_text: Mapped[str | None] = mapped_column(String(8))
    points: Mapped[float] = mapped_column(Float, default=0.0)
    laps: Mapped[int | None] = mapped_column(Integer)
    status: Mapped[str | None] = mapped_column(String(64))


class QualifyingResult(Base):
    __tablename__ = "qualifying_results"
    __table_args__ = (UniqueConstraint("race_id", "driver_id", name="uq_quali_race_driver"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    race_id: Mapped[int] = mapped_column(ForeignKey("races.id"), index=True)
    driver_id: Mapped[int] = mapped_column(ForeignKey("drivers.id"), index=True)
    constructor_id: Mapped[int] = mapped_column(ForeignKey("constructors.id"))
    position: Mapped[int | None] = mapped_column(Integer)
    q1: Mapped[str | None] = mapped_column(String(16))
    q2: Mapped[str | None] = mapped_column(String(16))
    q3: Mapped[str | None] = mapped_column(String(16))


class DriverStanding(Base):
    __tablename__ = "driver_standings"
    __table_args__ = (UniqueConstraint("race_id", "driver_id", name="uq_dstanding_race_driver"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    race_id: Mapped[int] = mapped_column(ForeignKey("races.id"), index=True)
    driver_id: Mapped[int] = mapped_column(ForeignKey("drivers.id"), index=True)
    points: Mapped[float] = mapped_column(Float, default=0.0)
    position: Mapped[int | None] = mapped_column(Integer)
    wins: Mapped[int] = mapped_column(Integer, default=0)


class ConstructorStanding(Base):
    __tablename__ = "constructor_standings"
    __table_args__ = (
        UniqueConstraint("race_id", "constructor_id", name="uq_cstanding_race_constructor"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    race_id: Mapped[int] = mapped_column(ForeignKey("races.id"), index=True)
    constructor_id: Mapped[int] = mapped_column(ForeignKey("constructors.id"), index=True)
    points: Mapped[float] = mapped_column(Float, default=0.0)
    position: Mapped[int | None] = mapped_column(Integer)
    wins: Mapped[int] = mapped_column(Integer, default=0)


class PitStop(Base):
    __tablename__ = "pit_stops"
    __table_args__ = (
        UniqueConstraint("race_id", "driver_id", "stop", name="uq_pitstop_race_driver_stop"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    race_id: Mapped[int] = mapped_column(ForeignKey("races.id"), index=True)
    driver_id: Mapped[int] = mapped_column(ForeignKey("drivers.id"), index=True)
    stop: Mapped[int] = mapped_column(Integer)
    lap: Mapped[int | None] = mapped_column(Integer)
    time_of_day: Mapped[str | None] = mapped_column(String(16))
    duration_ms: Mapped[int | None] = mapped_column(Integer)


class IngestCheckpoint(Base):
    """Tracks which (entity, season) chunks the resumable ingester has completed."""

    __tablename__ = "ingest_checkpoints"
    __table_args__ = (UniqueConstraint("entity", "season", name="uq_checkpoint_entity_season"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    entity: Mapped[str] = mapped_column(String(64))
    season: Mapped[int] = mapped_column(Integer, default=0)  # 0 = season-independent entity
    completed_at: Mapped[datetime] = mapped_column(DateTime)
