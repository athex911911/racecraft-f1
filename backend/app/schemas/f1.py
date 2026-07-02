from datetime import date, datetime

from pydantic import BaseModel


class DriverOut(BaseModel):
    id: int
    driver_ref: str
    code: str | None
    number: int | None
    full_name: str
    nationality: str | None
    headshot_url: str | None

    model_config = {"from_attributes": True}


class ConstructorOut(BaseModel):
    id: int
    constructor_ref: str
    name: str
    nationality: str | None
    color: str | None

    model_config = {"from_attributes": True}


class CircuitOut(BaseModel):
    id: int
    circuit_ref: str
    name: str
    location: str | None
    country: str | None
    lat: float | None
    lng: float | None
    length_km: float | None
    corners: int | None
    drs_zones: int | None
    track_type: str | None
    first_gp_year: int | None
    lap_record_time: str | None
    lap_record_driver: str | None
    lap_record_year: int | None

    model_config = {"from_attributes": True}


class DriverStandingOut(BaseModel):
    position: int
    points: float
    wins: int
    podiums: int
    driver: DriverOut
    constructor: ConstructorOut | None
    last_five: list[str]  # finish positions, newest last ("1", "DNF", ...)


class ConstructorStandingOut(BaseModel):
    position: int
    points: float
    wins: int
    podiums: int
    constructor: ConstructorOut
    drivers: list[DriverOut]
    last_five_points: list[float]  # points per round, newest last


class SessionSlot(BaseModel):
    name: str
    starts_at: datetime | None


class NextRaceOut(BaseModel):
    race_id: int
    season: int
    round: int
    name: str
    date: date
    time: str | None
    circuit: CircuitOut
    schedule: list[SessionSlot]
    previous_winner: str | None
    previous_pole: str | None
    previous_fastest_lap: str | None


class SeasonProgressOut(BaseModel):
    season: int
    total_rounds: int
    completed_rounds: int
    leader: DriverStandingOut | None
    leading_constructor: ConstructorStandingOut | None
    next_race: NextRaceOut | None


class ProgressPoint(BaseModel):
    round: int
    race_name: str
    points: float  # cumulative


class ProgressSeries(BaseModel):
    entity_id: int
    label: str
    color: str | None
    points: list[ProgressPoint]


class ChampionshipProgressOut(BaseModel):
    season: int
    entity_type: str  # "driver" | "constructor"
    series: list[ProgressSeries]


class TrendingStat(BaseModel):
    key: str
    label: str
    holder: str
    detail: str | None
    value: str
    color: str | None


class PodiumEntry(BaseModel):
    position: int
    driver: DriverOut
    constructor: ConstructorOut | None
    time_text: str | None


class RaceSummaryOut(BaseModel):
    race_id: int
    season: int
    round: int
    name: str
    date: date
    circuit: CircuitOut
    podium: list[PodiumEntry]
    fastest_lap_driver: str | None
    fastest_lap_time: str | None
    biggest_gainer: str | None
    biggest_gain: int | None
    pole_sitter: str | None
