from datetime import date

from pydantic import BaseModel

from app.schemas.f1 import CircuitOut, ConstructorOut, DriverOut


class LeagueDriverOption(BaseModel):
    driver: DriverOut
    constructor: ConstructorOut | None


class PredictionPicks(BaseModel):
    pole_driver_id: int | None = None
    winner_driver_id: int | None = None
    p2_driver_id: int | None = None
    p3_driver_id: int | None = None
    fastest_lap_driver_id: int | None = None


class ScoreBreakdown(BaseModel):
    pole: int
    winner: int
    podium: int
    fastest_lap: int
    total: int


class LeagueRaceItem(BaseModel):
    race_id: int
    season: int
    round: int
    name: str
    date: date
    time: str | None
    circuit: CircuitOut
    status: str  # "open" | "awaiting" | "completed"
    predicted: bool
    your_points: int | None


class LeagueRacesOut(BaseModel):
    season: int
    max_points: int
    races: list[LeagueRaceItem]


class LeagueRaceDetail(BaseModel):
    race: LeagueRaceItem
    options: list[LeagueDriverOption]
    prediction: PredictionPicks | None
    actual: PredictionPicks | None  # populated once the race is completed
    score: ScoreBreakdown | None


class SubmitPredictionIn(PredictionPicks):
    race_id: int


class LeaderboardEntry(BaseModel):
    rank: int
    user_id: int
    username: str
    display_name: str | None
    total_points: int
    scored: int
    is_you: bool = False


class LeaderboardOut(BaseModel):
    entries: list[LeaderboardEntry]
    your_rank: int | None


class MyPredictionItem(BaseModel):
    race: LeagueRaceItem
    picks: PredictionPicks
    score: ScoreBreakdown | None


class MyPredictionsOut(BaseModel):
    total_points: int
    scored: int
    items: list[MyPredictionItem]
