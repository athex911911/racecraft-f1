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
    logo_url: str | None = None

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


# --- Driver analytics (Phase 2) ---


class DriverListItem(BaseModel):
    driver: DriverOut
    constructor: ConstructorOut | None  # most recent within the scope
    season: int | None  # null for all-time career scope
    races: int
    wins: int
    podiums: int
    poles: int
    points: float
    best_finish: int | None


class DriverRating(BaseModel):
    key: str
    label: str
    value: float  # 0–100 normalised score
    detail: str  # human-readable underlying statistic


class DriverSeasonStat(BaseModel):
    season: int
    constructor: ConstructorOut | None
    races: int
    points: float
    wins: int
    podiums: int
    poles: int
    best_finish: int | None
    championship_position: int | None


class DriverCareerStats(BaseModel):
    seasons: int
    first_season: int | None
    last_season: int | None
    races: int
    wins: int
    podiums: int
    poles: int
    fastest_laps: int
    points: float
    dnfs: int
    titles: int
    best_championship_position: int | None
    win_rate: float  # 0–1
    podium_rate: float  # 0–1
    avg_grid: float | None
    avg_finish: float | None


class DriverResultLine(BaseModel):
    season: int
    round: int
    race_name: str
    circuit: str
    grid: int | None
    position: int | None
    position_text: str | None
    points: float
    status: str | None


class DriverDetailOut(BaseModel):
    driver: DriverOut
    dob: date | None
    current_constructor: ConstructorOut | None
    teams: list[ConstructorOut]
    career: DriverCareerStats
    ratings: list[DriverRating]
    seasons: list[DriverSeasonStat]
    strengths: list[str]
    weaknesses: list[str]
    recent_results: list[DriverResultLine]
    data_since: int | None  # earliest ingested season (stats coverage caveat)


# --- Constructor analytics (Phase 2) ---


class ConstructorDriver(BaseModel):
    driver: DriverOut
    races: int
    seasons: int
    is_current: bool


class ConstructorListItem(BaseModel):
    constructor: ConstructorOut
    season: int | None
    races: int
    wins: int
    podiums: int
    poles: int
    points: float
    championship_position: int | None
    drivers: list[DriverOut]  # lineup within the scope (carries headshots)


class ConstructorSeasonStat(BaseModel):
    season: int
    constructor: ConstructorOut | None  # the team itself (drives chart colour)
    races: int
    points: float
    wins: int
    podiums: int
    poles: int
    best_finish: int | None
    championship_position: int | None


class ConstructorCareerStats(BaseModel):
    seasons: int
    first_season: int | None
    last_season: int | None
    races: int
    entries: int  # individual car entries
    wins: int
    podiums: int
    poles: int
    one_twos: int
    fastest_laps: int
    points: float
    dnfs: int
    titles: int
    best_championship_position: int | None
    win_rate: float
    podium_rate: float
    avg_grid: float | None
    avg_finish: float | None


class ConstructorResultLine(BaseModel):
    season: int
    round: int
    race_name: str
    best_position: int | None
    points: float
    car_results: list[str]  # e.g. ["VER P1", "LAW R"]


class ConstructorDetailOut(BaseModel):
    constructor: ConstructorOut
    career: ConstructorCareerStats
    ratings: list[DriverRating]
    seasons: list[ConstructorSeasonStat]
    drivers: list[ConstructorDriver]  # lineup + alumni, most recent first
    strengths: list[str]
    weaknesses: list[str]
    recent_results: list[ConstructorResultLine]
    data_since: int | None


# --- Circuit analytics (Phase 2) ---


class CircuitListItem(BaseModel):
    circuit: CircuitOut
    races_held: int  # completed GPs in the ingested data
    first_year: int | None
    last_year: int | None
    on_current_calendar: bool
    last_winner: str | None


class CircuitWinnerLine(BaseModel):
    season: int
    race_name: str
    driver: DriverOut
    constructor: ConstructorOut | None
    grid: int | None
    time_text: str | None


class TopEntry(BaseModel):
    """A 'most successful here' row (driver or constructor) with win count."""

    label: str
    color: str | None
    value: int


class CircuitDetailOut(BaseModel):
    circuit: CircuitOut
    races_held: int
    first_year: int | None
    last_year: int | None
    on_current_calendar: bool
    next_race_date: date | None
    distinct_winners: int
    pole_win_rate: float | None  # share of races won from pole (0–1)
    dnf_rate: float | None  # share of car entries not classified (0–1)
    avg_finishers: float | None  # classified cars per race
    top_drivers: list[TopEntry]
    top_constructors: list[TopEntry]
    winners: list[CircuitWinnerLine]  # most recent first
    data_since: int | None


# --- Calendar / history explorer (Phase 2) ---


class CalendarRace(BaseModel):
    race_id: int
    season: int
    round: int
    name: str
    date: date
    time: str | None
    circuit: CircuitOut
    completed: bool
    winner: str | None
    winner_color: str | None
    pole_sitter: str | None


class RaceResultRow(BaseModel):
    position: int | None
    position_text: str | None
    driver: DriverOut
    constructor: ConstructorOut | None
    grid: int | None
    points: float
    status: str | None
    fastest_lap: bool
    time_text: str | None


class RaceDetailOut(BaseModel):
    race_id: int
    season: int
    round: int
    name: str
    date: date
    circuit: CircuitOut
    pole_sitter: str | None
    fastest_lap_driver: str | None
    results: list[RaceResultRow]


# --- Driver vs driver comparison (Phase 2) ---


class HeadToHead(BaseModel):
    shared_races: int
    a_race_ahead: int  # times A finished ahead of B (both classified)
    b_race_ahead: int
    a_quali_ahead: int
    b_quali_ahead: int


class CompareOut(BaseModel):
    a: DriverDetailOut
    b: DriverDetailOut
    head_to_head: HeadToHead


# --- Race predictor + championship simulation (Phase 3) ---


class PredictionFactor(BaseModel):
    text: str  # human-readable stat behind the prediction
    positive: bool  # whether it pushes the win probability up or down


class RacePredictionEntry(BaseModel):
    driver: DriverOut
    constructor: ConstructorOut | None
    grid: int | None
    win_prob: float  # normalised share of the field's win probability (sums to 1)
    podium_prob: float  # raw model probability
    top10_prob: float
    factors: list[PredictionFactor]
    actual_position: int | None  # populated for completed races (backtest view)
    actual_text: str | None  # "R"/"D"/"W" when the real result was a non-finish


class PredictModelInfo(BaseModel):
    algorithm: str
    trained_at: str | None
    train_seasons: str | None
    holdout_seasons: str | None
    holdout_races: int | None
    auc_win: float | None
    auc_podium: float | None
    winner_pick_rate: float | None  # holdout share of races where top pick won
    features: list[str]


class RacePredictionOut(BaseModel):
    race_id: int
    season: int
    round: int
    name: str
    date: date
    circuit: CircuitOut
    completed: bool
    grid_source: str  # "official" | "qualifying" | "estimated"
    certainty: float  # 0-1, entropy-based spread of the win probabilities
    model: PredictModelInfo
    entries: list[RacePredictionEntry]


class TitleContender(BaseModel):
    driver: DriverOut
    constructor: ConstructorOut | None
    current_points: float
    current_position: int | None
    title_prob: float
    top3_prob: float
    expected_points: float


class ChampionshipSimOut(BaseModel):
    season: int
    completed_rounds: int
    total_rounds: int
    remaining_sprints: int
    iterations: int
    contenders: list[TitleContender]


# --- Global search (Phase 2) ---


class SearchDriver(BaseModel):
    ref: str
    name: str
    code: str | None
    nationality: str | None
    headshot_url: str | None


class SearchConstructor(BaseModel):
    ref: str
    name: str
    color: str | None
    logo_url: str | None


class SearchCircuit(BaseModel):
    ref: str
    name: str
    location: str | None
    country: str | None


class SearchOut(BaseModel):
    drivers: list[SearchDriver]
    constructors: list[SearchConstructor]
    circuits: list[SearchCircuit]
