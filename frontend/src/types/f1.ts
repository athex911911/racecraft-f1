/** Mirrors backend/app/schemas/f1.py */

export interface Driver {
  id: number;
  driver_ref: string;
  code: string | null;
  number: number | null;
  full_name: string;
  nationality: string | null;
  headshot_url: string | null;
}

export interface Constructor {
  id: number;
  constructor_ref: string;
  name: string;
  nationality: string | null;
  color: string | null;
  logo_url: string | null;
}

export interface Circuit {
  id: number;
  circuit_ref: string;
  name: string;
  location: string | null;
  country: string | null;
  lat: number | null;
  lng: number | null;
  length_km: number | null;
  corners: number | null;
  drs_zones: number | null;
  track_type: string | null;
  first_gp_year: number | null;
  lap_record_time: string | null;
  lap_record_driver: string | null;
  lap_record_year: number | null;
}

export interface DriverStanding {
  position: number;
  points: number;
  wins: number;
  podiums: number;
  driver: Driver;
  constructor: Constructor | null;
  last_five: string[];
}

export interface ConstructorStanding {
  position: number;
  points: number;
  wins: number;
  podiums: number;
  constructor: Constructor;
  drivers: Driver[];
  last_five_points: number[];
}

export interface SessionSlot {
  name: string;
  starts_at: string | null;
}

export interface NextRace {
  race_id: number;
  season: number;
  round: number;
  name: string;
  date: string;
  time: string | null;
  circuit: Circuit;
  schedule: SessionSlot[];
  previous_winner: string | null;
  previous_pole: string | null;
  previous_fastest_lap: string | null;
}

export interface SeasonProgress {
  season: number;
  total_rounds: number;
  completed_rounds: number;
  leader: DriverStanding | null;
  leading_constructor: ConstructorStanding | null;
  next_race: NextRace | null;
}

export interface ProgressPoint {
  round: number;
  race_name: string;
  points: number;
}

export interface ProgressSeries {
  entity_id: number;
  label: string;
  color: string | null;
  points: ProgressPoint[];
}

export interface ChampionshipProgress {
  season: number;
  entity_type: "driver" | "constructor";
  series: ProgressSeries[];
}

export interface TrendingStat {
  key: string;
  label: string;
  holder: string;
  detail: string | null;
  value: string;
  color: string | null;
}

export interface PodiumEntry {
  position: number;
  driver: Driver;
  constructor: Constructor | null;
  time_text: string | null;
}

export interface RaceSummary {
  race_id: number;
  season: number;
  round: number;
  name: string;
  date: string;
  circuit: Circuit;
  podium: PodiumEntry[];
  fastest_lap_driver: string | null;
  fastest_lap_time: string | null;
  biggest_gainer: string | null;
  biggest_gain: number | null;
  pole_sitter: string | null;
}

export interface HealthStatus {
  status: string;
  database: string;
  version: string;
}

// --- Driver analytics (Phase 2) ---

export interface DriverListItem {
  driver: Driver;
  constructor: Constructor | null;
  season: number | null;
  races: number;
  wins: number;
  podiums: number;
  poles: number;
  points: number;
  best_finish: number | null;
}

export interface DriverRating {
  key: string;
  label: string;
  value: number;
  detail: string;
}

export interface DriverSeasonStat {
  season: number;
  constructor: Constructor | null;
  races: number;
  points: number;
  wins: number;
  podiums: number;
  poles: number;
  best_finish: number | null;
  championship_position: number | null;
}

export interface DriverCareerStats {
  seasons: number;
  first_season: number | null;
  last_season: number | null;
  races: number;
  wins: number;
  podiums: number;
  poles: number;
  fastest_laps: number;
  points: number;
  dnfs: number;
  titles: number;
  best_championship_position: number | null;
  win_rate: number;
  podium_rate: number;
  avg_grid: number | null;
  avg_finish: number | null;
}

export interface DriverResultLine {
  season: number;
  round: number;
  race_name: string;
  circuit: string;
  grid: number | null;
  position: number | null;
  position_text: string | null;
  points: number;
  status: string | null;
}

export interface DriverDetail {
  driver: Driver;
  dob: string | null;
  current_constructor: Constructor | null;
  teams: Constructor[];
  career: DriverCareerStats;
  ratings: DriverRating[];
  seasons: DriverSeasonStat[];
  strengths: string[];
  weaknesses: string[];
  recent_results: DriverResultLine[];
  data_since: number | null;
}

// --- Constructor analytics (Phase 2) ---

export interface ConstructorListItem {
  constructor: Constructor;
  season: number | null;
  races: number;
  wins: number;
  podiums: number;
  poles: number;
  points: number;
  championship_position: number | null;
  drivers: Driver[];
}

// Structurally identical to DriverSeasonStat, so it reuses SeasonPointsChart.
export interface ConstructorSeasonStat {
  season: number;
  constructor: Constructor | null;
  races: number;
  points: number;
  wins: number;
  podiums: number;
  poles: number;
  best_finish: number | null;
  championship_position: number | null;
}

export interface ConstructorCareerStats {
  seasons: number;
  first_season: number | null;
  last_season: number | null;
  races: number;
  entries: number;
  wins: number;
  podiums: number;
  poles: number;
  one_twos: number;
  fastest_laps: number;
  points: number;
  dnfs: number;
  titles: number;
  best_championship_position: number | null;
  win_rate: number;
  podium_rate: number;
  avg_grid: number | null;
  avg_finish: number | null;
}

export interface ConstructorDriver {
  driver: Driver;
  races: number;
  seasons: number;
  is_current: boolean;
}

export interface ConstructorResultLine {
  season: number;
  round: number;
  race_name: string;
  best_position: number | null;
  points: number;
  car_results: string[];
}

export interface ConstructorDetail {
  constructor: Constructor;
  career: ConstructorCareerStats;
  ratings: DriverRating[];
  seasons: ConstructorSeasonStat[];
  drivers: ConstructorDriver[];
  strengths: string[];
  weaknesses: string[];
  recent_results: ConstructorResultLine[];
  data_since: number | null;
}

// --- Circuit analytics (Phase 2) ---

export interface CircuitListItem {
  circuit: Circuit;
  races_held: number;
  first_year: number | null;
  last_year: number | null;
  on_current_calendar: boolean;
  last_winner: string | null;
}

export interface CircuitWinnerLine {
  season: number;
  race_name: string;
  driver: Driver;
  constructor: Constructor | null;
  grid: number | null;
  time_text: string | null;
}

export interface TopEntry {
  label: string;
  color: string | null;
  value: number;
}

export interface CircuitDetail {
  circuit: Circuit;
  races_held: number;
  first_year: number | null;
  last_year: number | null;
  on_current_calendar: boolean;
  next_race_date: string | null;
  distinct_winners: number;
  pole_win_rate: number | null;
  dnf_rate: number | null;
  avg_finishers: number | null;
  top_drivers: TopEntry[];
  top_constructors: TopEntry[];
  winners: CircuitWinnerLine[];
  data_since: number | null;
}

// --- Calendar / history (Phase 2) ---

export interface CalendarRace {
  race_id: number;
  season: number;
  round: number;
  name: string;
  date: string;
  time: string | null;
  circuit: Circuit;
  completed: boolean;
  winner: string | null;
  winner_color: string | null;
  pole_sitter: string | null;
}

export interface RaceResultRow {
  position: number | null;
  position_text: string | null;
  driver: Driver;
  constructor: Constructor | null;
  grid: number | null;
  points: number;
  status: string | null;
  fastest_lap: boolean;
  time_text: string | null;
}

export interface RaceDetail {
  race_id: number;
  season: number;
  round: number;
  name: string;
  date: string;
  circuit: Circuit;
  pole_sitter: string | null;
  fastest_lap_driver: string | null;
  results: RaceResultRow[];
}

// --- Hall of Fame (Phase 2) ---

export interface RecordEntry {
  ref: string | null;
  label: string;
  color: string | null;
  value: number;
  display: string;
}

export interface RecordCategory {
  key: string;
  title: string;
  entries: RecordEntry[];
}

export interface HallOfFame {
  seasons_covered: string;
  drivers: RecordCategory[];
  constructors: RecordCategory[];
}

// --- Compare (Phase 2) ---

export interface HeadToHead {
  shared_races: number;
  a_race_ahead: number;
  b_race_ahead: number;
  a_quali_ahead: number;
  b_quali_ahead: number;
}

export interface CompareResult {
  a: DriverDetail;
  b: DriverDetail;
  head_to_head: HeadToHead;
}
