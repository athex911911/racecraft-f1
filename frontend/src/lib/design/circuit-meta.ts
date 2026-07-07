/**
 * Official corner tables for the marquee circuits: FIA turn numbers + the
 * canonical corner names, plus the two sector-split points.
 *
 * Corner *names and counts* are official (per each circuit's published layout).
 * Corner *positions* are expressed as a fraction of lap distance `t` in [0,1),
 * anchored to the real centre-line geometry (CIRCUIT_GEO) — so labels land on
 * the tarmac, but the exact apex fraction is modelled, not surveyed. Sector
 * splits are placed at the commonly-cited boundary and are approximate: F1 does
 * not publish timing-loop coordinates.
 *
 * Circuits without an entry here fall back to the geometry corner model.
 */

export type TurnMeta = {
  n: number;
  /** canonical name; only shown on the map when `major` */
  name?: string;
  /** fraction of lap distance from start/finish, in the geometry's travel order */
  t: number;
  /** show the name inline on the map (the famous corners) */
  major?: boolean;
};

export type CircuitMeta = {
  turns: TurnMeta[];
  /** lap-distance fractions of the S1→S2 and S2→S3 boundaries (approximate) */
  sectors: [number, number];
  /**
   * Geometry-fraction of the true start/finish line. The CIRCUIT_GEO trace
   * doesn't always begin at S/F, so all turn/sector `t` values are measured
   * from here. Defaults to 0 (trace starts at S/F).
   */
  sf?: number;
};

export const CIRCUIT_META: Record<string, CircuitMeta> = {
  // Silverstone — 18 turns, clockwise from the Hamilton Straight.
  silverstone: {
    sectors: [0.34, 0.8],
    turns: [
      { n: 1, name: "Abbey", t: 0.045, major: true },
      { n: 2, name: "Farm", t: 0.095 },
      { n: 3, name: "Village", t: 0.155, major: true },
      { n: 4, name: "The Loop", t: 0.195 },
      { n: 5, name: "Aintree", t: 0.235 },
      { n: 6, name: "Brooklands", t: 0.385, major: true },
      { n: 7, name: "Luffield", t: 0.465 },
      { n: 8, name: "Woodcote", t: 0.51 },
      { n: 9, name: "Copse", t: 0.59, major: true },
      { n: 10, name: "Maggotts", t: 0.625, major: true },
      { n: 11, name: "Becketts", t: 0.655, major: true },
      { n: 12, t: 0.68 },
      { n: 13, t: 0.705 },
      { n: 14, name: "Chapel", t: 0.728 },
      { n: 15, name: "Stowe", t: 0.857, major: true },
      { n: 16, name: "Vale", t: 0.888 },
      { n: 17, name: "Club", t: 0.925, major: true },
      { n: 18, t: 0.955 },
    ],
  },

  // Suzuka — 18 turns, the figure-eight.
  suzuka: {
    sectors: [0.33, 0.72],
    turns: [
      { n: 1, t: 0.075 },
      { n: 2, t: 0.104 },
      { n: 3, name: "S Curves", t: 0.15, major: true },
      { n: 4, t: 0.185 },
      { n: 5, t: 0.22 },
      { n: 6, t: 0.255 },
      { n: 7, name: "Dunlop", t: 0.29, major: true },
      { n: 8, name: "Degner 1", t: 0.355, major: true },
      { n: 9, name: "Degner 2", t: 0.385 },
      { n: 10, t: 0.44 },
      { n: 11, name: "Hairpin", t: 0.47, major: true },
      { n: 12, t: 0.53 },
      { n: 13, name: "Spoon", t: 0.6, major: true },
      { n: 14, t: 0.64 },
      { n: 15, name: "130R", t: 0.82, major: true },
      { n: 16, name: "Casio Triangle", t: 0.875, major: true },
      { n: 17, t: 0.9 },
      { n: 18, t: 0.925 },
    ],
  },

  // Monza — 11 turns, the Temple of Speed.
  monza: {
    sectors: [0.3, 0.68],
    turns: [
      { n: 1, name: "Rettifilo", t: 0.105, major: true },
      { n: 2, t: 0.135 },
      { n: 3, name: "Curva Grande", t: 0.21, major: true },
      { n: 4, name: "Roggia", t: 0.34, major: true },
      { n: 5, t: 0.365 },
      { n: 6, name: "Lesmo 1", t: 0.445, major: true },
      { n: 7, name: "Lesmo 2", t: 0.49 },
      { n: 8, name: "Ascari", t: 0.61, major: true },
      { n: 9, t: 0.635 },
      { n: 10, t: 0.66 },
      { n: 11, name: "Parabolica", t: 0.84, major: true },
    ],
  },

  // Spa-Francorchamps — 19 turns.
  spa: {
    sectors: [0.16, 0.68],
    turns: [
      { n: 1, name: "La Source", t: 0.035, major: true },
      { n: 2, name: "Eau Rouge", t: 0.081, major: true },
      { n: 3, name: "Raidillon", t: 0.1, major: true },
      { n: 4, t: 0.144 },
      { n: 5, name: "Les Combes", t: 0.209, major: true },
      { n: 6, t: 0.24 },
      { n: 7, name: "Malmedy", t: 0.27 },
      { n: 8, name: "Bruxelles", t: 0.33, major: true },
      { n: 9, t: 0.361 },
      { n: 10, name: "Rivage", t: 0.42 },
      { n: 11, t: 0.449 },
      { n: 12, name: "Pouhon", t: 0.526, major: true },
      { n: 13, t: 0.557 },
      { n: 14, name: "Fagnes", t: 0.627 },
      { n: 15, t: 0.66 },
      { n: 16, name: "Stavelot", t: 0.687, major: true },
      { n: 17, t: 0.778 },
      { n: 18, name: "Blanchimont", t: 0.821, major: true },
      { n: 19, name: "Bus Stop", t: 0.9, major: true },
    ],
  },
};
