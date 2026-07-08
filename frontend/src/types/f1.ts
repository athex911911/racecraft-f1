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

// --- Race predictor + championship simulation (Phase 3) ---

export interface PredictionFactor {
  text: string;
  positive: boolean;
}

export interface RacePredictionEntry {
  driver: Driver;
  constructor: Constructor | null;
  grid: number | null;
  win_prob: number;
  podium_prob: number;
  top10_prob: number;
  factors: PredictionFactor[];
  actual_position: number | null;
  actual_text: string | null;
}

export interface PredictModelInfo {
  algorithm: string;
  trained_at: string | null;
  train_seasons: string | null;
  holdout_seasons: string | null;
  holdout_races: number | null;
  auc_win: number | null;
  auc_podium: number | null;
  winner_pick_rate: number | null;
  features: string[];
}

export interface RacePrediction {
  race_id: number;
  season: number;
  round: number;
  name: string;
  date: string;
  circuit: Circuit;
  completed: boolean;
  grid_source: "official" | "qualifying" | "estimated";
  certainty: number;
  model: PredictModelInfo;
  entries: RacePredictionEntry[];
}

export interface TitleContender {
  driver: Driver;
  constructor: Constructor | null;
  current_points: number;
  current_position: number | null;
  title_prob: number;
  top3_prob: number;
  expected_points: number;
}

export interface ChampionshipSim {
  season: number;
  completed_rounds: number;
  total_rounds: number;
  remaining_sprints: number;
  iterations: number;
  contenders: TitleContender[];
}

// --- Global search (Phase 2) ---

export interface SearchDriver {
  ref: string;
  name: string;
  code: string | null;
  nationality: string | null;
  headshot_url: string | null;
}

export interface SearchConstructor {
  ref: string;
  name: string;
  color: string | null;
  logo_url: string | null;
}

export interface SearchCircuit {
  ref: string;
  name: string;
  location: string | null;
  country: string | null;
}

export interface SearchResults {
  drivers: SearchDriver[];
  constructors: SearchConstructor[];
  circuits: SearchCircuit[];
}

// --- Strategy simulator (Phase 3) ---
export interface StrategyCircuitListItem {
  circuit_ref: string;
  name: string;
  country: string | null;
  laps: number;
  base_lap_s: number;
  pit_loss_s: number;
  on_calendar: boolean;
  has_pace: boolean;
}

export interface StrategyCompound {
  key: string;
  name: string;
  color: string;
  offset: number;
  deg: number;
}

export interface StrategyStint {
  compound: string;
  name: string;
  color: string;
  start_lap: number;
  end_lap: number;
  laps: number;
}

export interface StrategyOption {
  key: string;
  label: string;
  stops: number;
  stints: StrategyStint[];
  pits: number[];
  compound_sequence: string[];
  total_time_s: number;
  total_time_str: string;
  avg_lap_s: number;
  lap_pace: number[];
  delta_s: number;
}

export interface StrategyCircuitInfo {
  circuit_ref: string;
  name: string;
  country: string | null;
  laps: number;
  base_lap_s: number;
  base_lap_str: string;
  pit_loss_s: number;
  deg_mode: string;
  real_avg_stops: number | null;
  calibrated: boolean;
}

export interface StrategySim {
  circuit: StrategyCircuitInfo;
  compounds: StrategyCompound[];
  optimal_key: string;
  strategies: StrategyOption[];
}

// --- Track suitability (Phase 3) ---
export interface SuitabilityEntry {
  driver: Driver;
  constructor: Constructor | null;
  score: number;
  here_starts: number;
  here_best: number | null;
  reason: string;
}

export interface SuitabilityResult {
  circuit_ref: string;
  track_type: string | null;
  entries: SuitabilityEntry[];
}

// --- Weather + tyre analytics (Phase 3, FastF1) ---
export interface RaceConditionLine {
  season: number;
  race_name: string;
  air_temp: number | null;
  track_temp: number | null;
  rainfall: boolean;
  wet_fraction: number;
}

export interface CircuitConditions {
  circuit_ref: string;
  races_with_data: number;
  avg_air_temp: number | null;
  avg_track_temp: number | null;
  wet_races: number;
  wet_rate: number | null;
  recent: RaceConditionLine[];
}

export interface WetRatingEntry {
  driver: Driver;
  constructor: Constructor | null;
  wet_races: number;
  wet_avg_finish: number;
  dry_avg_finish: number | null;
  delta: number;
}

export interface WetRatings {
  wet_race_count: number;
  entries: WetRatingEntry[];
}

export interface CompoundUsage {
  compound: string;
  color: string;
  stints: number;
  laps: number;
  share: number;
  avg_stint_laps: number;
  avg_pace_s: number | null;
  deg_s_per_lap: number | null;
}

export interface CircuitTyres {
  circuit_ref: string;
  races_with_data: number;
  compounds: CompoundUsage[];
}

export interface TyreOverview {
  races_with_data: number;
  compounds: CompoundUsage[];
}

// --- Auth + profiles (Phase 4) ---
export type FavoriteKind = "driver" | "constructor" | "circuit";

export interface Favorite {
  entity_type: FavoriteKind;
  entity_ref: string;
}

export interface AuthUser {
  id: number;
  email: string;
  username: string;
  display_name: string | null;
  theme: string;
  created_at: string;
  favorites: Favorite[];
}

export interface AuthToken {
  access_token: string;
  token_type: string;
  user: AuthUser;
}

// --- Prediction League (Phase 4) ---
export type LeagueRaceStatus = "open" | "awaiting" | "completed";

export interface LeagueDriverOption {
  driver: Driver;
  constructor: Constructor | null;
}

export interface PredictionPicks {
  pole_driver_id: number | null;
  winner_driver_id: number | null;
  p2_driver_id: number | null;
  p3_driver_id: number | null;
  fastest_lap_driver_id: number | null;
}

export type SubmitPrediction = PredictionPicks & { race_id: number };

export interface ScoreBreakdown {
  pole: number;
  winner: number;
  podium: number;
  fastest_lap: number;
  total: number;
}

export interface LeagueRaceItem {
  race_id: number;
  season: number;
  round: number;
  name: string;
  date: string;
  time: string | null;
  circuit: Circuit;
  status: LeagueRaceStatus;
  predicted: boolean;
  your_points: number | null;
}

export interface LeagueRaces {
  season: number;
  max_points: number;
  races: LeagueRaceItem[];
}

export interface LeagueRaceDetail {
  race: LeagueRaceItem;
  options: LeagueDriverOption[];
  prediction: PredictionPicks | null;
  actual: PredictionPicks | null;
  score: ScoreBreakdown | null;
}

export interface LeaderboardEntry {
  rank: number;
  user_id: number;
  username: string;
  display_name: string | null;
  total_points: number;
  scored: number;
  is_you: boolean;
}

export interface Leaderboard {
  entries: LeaderboardEntry[];
  your_rank: number | null;
}

export interface MyPredictionItem {
  race: LeagueRaceItem;
  picks: PredictionPicks;
  score: ScoreBreakdown | null;
}

export interface MyPredictions {
  total_points: number;
  scored: number;
  items: MyPredictionItem[];
}

// --- AI Assistant (Phase 4) ---
export interface AssistantStat {
  label: string;
  value: string;
}

export interface AssistantEntity {
  kind: FavoriteKind;
  ref: string;
  name: string;
}

export interface AssistantAnswer {
  answer: string;
  intent: string;
  provider: string;
  stats: AssistantStat[];
  entities: AssistantEntity[];
  suggestions: string[];
}
