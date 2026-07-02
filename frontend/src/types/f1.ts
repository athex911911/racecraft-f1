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
