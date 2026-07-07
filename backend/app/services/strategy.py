"""Deterministic race-strategy simulator.

A physically-motivated lap-time model (tyre compound pace + degradation, fuel
burn, pit-lane loss) run over a race distance to rank pit strategies and find
the optimum. This is a *model*, not telemetry: race distance and a reference
lap time come from the ingested results (real), while the tyre-degradation and
pit-loss numbers are calibrated parameters (tunable). No FastF1 pull needed.

Lap time (seconds) for a given lap =
    base_lap
  + compound.offset                      (soft is the fast reference, ~0)
  + fuel(lap)                            (heavy early, ~0 by the flag)
  + degradation(compound, tyre_age) * severity

Total race time = Σ lap times + pit_loss × (number of stops). F1's "use two
compounds" rule is enforced when picking the optimum.
"""

from __future__ import annotations

import re
from collections import defaultdict
from dataclasses import dataclass
from statistics import mean, median

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.f1 import Circuit, Race, Result, TyreStint


# --- tyre + fuel model (calibrated, tunable) --------------------------------
@dataclass(frozen=True)
class Compound:
    key: str
    name: str
    color: str
    offset: float  # seconds slower than the soft reference when fresh
    deg: float     # seconds/lap lost to degradation (per lap of tyre age)


COMPOUNDS: dict[str, Compound] = {
    "soft": Compound("soft", "Soft", "#FF2D2D", 0.0, 0.090),
    "medium": Compound("medium", "Medium", "#FFD11A", 0.55, 0.050),
    "hard": Compound("hard", "Hard", "#E6E6E6", 1.15, 0.028),
}

FUEL_TOTAL_S = 3.0        # full tank is this much slower than an empty one
DEG_CLIFF_LAP = 20        # past this tyre age, degradation accelerates
DEG_CLIFF_MULT = 2.0      # multiplier on the marginal deg beyond the cliff
MIN_STINT = 7             # a realistic minimum stint length (laps)

DEG_MODE = {"low": 0.7, "normal": 1.0, "high": 1.4}

# time lost in the pit lane vs staying out, seconds — modelled per circuit
PIT_LOSS: dict[str, float] = {
    "monaco": 19.5, "monza": 23.0, "silverstone": 20.5, "spa": 18.5,
    "zandvoort": 21.0, "catalunya": 21.5, "bahrain": 22.5, "jeddah": 18.0,
    "albert_park": 19.0, "suzuka": 22.0, "baku": 18.5, "miami": 19.5,
    "imola": 26.0, "red_bull_ring": 20.0, "hungaroring": 20.5, "interlagos": 20.0,
    "rodriguez": 22.0, "vegas": 18.0, "losail": 24.0, "marina_bay": 27.0,
    "americas": 22.0, "villeneuve": 17.5, "yas_marina": 21.0, "shanghai": 22.5,
    "portimao": 20.0,
}
DEFAULT_PIT_LOSS = 21.0

# relative tyre stress (>1 harsher on tyres, <1 gentler) — modelled per circuit
SEVERITY: dict[str, float] = {
    "silverstone": 1.30, "suzuka": 1.35, "catalunya": 1.30, "zandvoort": 1.20,
    "spa": 1.15, "interlagos": 1.10, "red_bull_ring": 1.05, "bahrain": 1.25,
    "losail": 1.30, "americas": 1.15, "hungaroring": 1.05, "portimao": 1.20,
    "monaco": 0.60, "marina_bay": 0.80, "baku": 0.80, "jeddah": 0.90,
    "vegas": 0.75, "villeneuve": 0.85, "monza": 0.85, "yas_marina": 0.95,
    "miami": 1.00, "imola": 1.05, "shanghai": 1.05, "rodriguez": 0.90,
}
DEFAULT_SEVERITY = 1.0

# --- fallbacks for circuits with no recent ingested race lap ----------------
FALLBACK_LAPS: dict[str, int] = {"madring": 57}
FALLBACK_BASE: dict[str, float] = {"madring": 92.0}

_pace_cache: dict[str, tuple[int, float]] | None = None


def _seconds(text: str | None) -> float | None:
    """Parse '1:27.097' or '87.097' → seconds."""
    if not text:
        return None
    m = re.match(r"(?:(\d+):)?(\d+(?:\.\d+)?)$", text.strip())
    if not m:
        return None
    minutes = int(m.group(1)) if m.group(1) else 0
    return minutes * 60 + float(m.group(2))


def _pace_table(db: Session) -> dict[str, tuple[int, float]]:
    """{circuit_ref: (race_laps, base_lap_s)} derived from ingested results."""
    global _pace_cache
    if _pace_cache is not None:
        return _pace_cache
    rows = db.execute(
        select(
            Circuit.circuit_ref,
            func.max(Result.laps),
            func.min(Result.fastest_lap_time),
        )
        .join(Race, Race.circuit_id == Circuit.id)
        .join(Result, Result.race_id == Race.id)
        .where(Race.season >= 2021, Result.fastest_lap_time.is_not(None))
        .group_by(Circuit.circuit_ref)
    ).all()
    table: dict[str, tuple[int, float]] = {}
    for ref, laps, fastest in rows:
        base = _seconds(fastest)
        if laps and base:
            table[ref] = (int(laps), round(base, 3))
    _pace_cache = table
    return table


def _params(db: Session, circuit: Circuit) -> tuple[int, float, float, float] | None:
    """(laps, base_lap_s, pit_loss_s, severity) for a circuit, or None."""
    table = _pace_table(db)
    ref = circuit.circuit_ref
    if ref in table:
        laps, base = table[ref]
    elif ref in FALLBACK_LAPS:
        laps, base = FALLBACK_LAPS[ref], FALLBACK_BASE.get(ref, 90.0)
    else:
        rec = _seconds(circuit.lap_record_time)
        if rec is None:
            return None
        laps, base = 58, round(rec + 2.5, 3)  # rough race-trim offset over the record
    return laps, base, PIT_LOSS.get(ref, DEFAULT_PIT_LOSS), SEVERITY.get(ref, DEFAULT_SEVERITY)


# --- the model --------------------------------------------------------------
def _deg_at(c: Compound, age: int, sev: float) -> float:
    d = c.deg * age
    if age > DEG_CLIFF_LAP:
        d += c.deg * (age - DEG_CLIFF_LAP) * (DEG_CLIFF_MULT - 1.0)
    return d * sev


def _build_tables(laps: int, sev: float) -> tuple[list[float], dict[str, list[float]]]:
    """Prefix sums so any stint's cost is O(1) during the search."""
    fuel_prefix = [0.0] * (laps + 1)
    for lap in range(laps):
        fuel = FUEL_TOTAL_S * (laps - lap) / laps
        fuel_prefix[lap + 1] = fuel_prefix[lap] + fuel
    deg_cum: dict[str, list[float]] = {}
    for key, c in COMPOUNDS.items():
        cum = [0.0] * (laps + 1)
        for age in range(laps):
            cum[age + 1] = cum[age] + _deg_at(c, age, sev)
        deg_cum[key] = cum
    return fuel_prefix, deg_cum


def _stint_cost(
    c: str, start: int, length: int, base: float,
    fuel_prefix: list[float], deg_cum: dict[str, list[float]],
) -> float:
    comp = COMPOUNDS[c]
    return (
        length * (base + comp.offset)
        + (fuel_prefix[start + length] - fuel_prefix[start])
        + deg_cum[c][length]
    )


def _best_for_boundaries(
    starts: list[int], lengths: list[int], base: float, pit_loss: float,
    fuel_prefix: list[float], deg_cum: dict[str, list[float]],
) -> tuple[float, list[str]]:
    """Best compound per stint (independent) with the two-compound rule enforced."""
    comps: list[str] = []
    total = pit_loss * (len(lengths) - 1)
    for s, ln in zip(starts, lengths):
        best_c = min(COMPOUNDS, key=lambda c: _stint_cost(c, s, ln, base, fuel_prefix, deg_cum))
        comps.append(best_c)
        total += _stint_cost(best_c, s, ln, base, fuel_prefix, deg_cum)
    if len(set(comps)) == 1:  # illegal: introduce a second compound at least cost
        cur = comps[0]
        best_delta, best_i, best_alt = float("inf"), 0, cur
        for i, (s, ln) in enumerate(zip(starts, lengths)):
            for alt in COMPOUNDS:
                if alt == cur:
                    continue
                d = (_stint_cost(alt, s, ln, base, fuel_prefix, deg_cum)
                     - _stint_cost(cur, s, ln, base, fuel_prefix, deg_cum))
                if d < best_delta:
                    best_delta, best_i, best_alt = d, i, alt
        comps[best_i] = best_alt
        total += best_delta
    return total, comps


def _optimise(
    nstops: int, laps: int, base: float, pit_loss: float,
    fuel_prefix: list[float], deg_cum: dict[str, list[float]],
) -> tuple[float, list[int], list[str]] | None:
    """Cheapest strategy with exactly `nstops` stops. Returns (total, starts, compounds)."""
    best: tuple[float, list[int], list[str]] | None = None

    def consider(cuts: list[int]) -> None:
        nonlocal best
        bounds = [0, *cuts, laps]
        starts = bounds[:-1]
        lengths = [bounds[i + 1] - bounds[i] for i in range(len(bounds) - 1)]
        if any(ln < MIN_STINT for ln in lengths):
            return
        total, comps = _best_for_boundaries(starts, lengths, base, pit_loss, fuel_prefix, deg_cum)
        if best is None or total < best[0]:
            best = (total, starts, comps)

    lo, hi = MIN_STINT, laps - MIN_STINT
    if nstops == 1:
        for a in range(lo, hi + 1):
            consider([a])
    elif nstops == 2:
        for a in range(lo, hi + 1):
            for b in range(a + MIN_STINT, hi + 1):
                consider([a, b])
    elif nstops == 3:
        for a in range(lo, hi + 1):
            for b in range(a + MIN_STINT, hi + 1):
                for cc in range(b + MIN_STINT, hi + 1):
                    consider([a, b, cc])
    return best


def _lap_pace(starts: list[int], comps: list[str], laps: int, base: float, sev: float) -> list[float]:
    bounds = [*starts, laps]
    pace: list[float] = []
    for si, c in enumerate(comps):
        comp = COMPOUNDS[c]
        for age in range(bounds[si + 1] - bounds[si]):
            lap = bounds[si] + age
            fuel = FUEL_TOTAL_S * (laps - lap) / laps
            pace.append(round(base + comp.offset + fuel + _deg_at(comp, age, sev), 3))
    return pace


def _fmt(seconds: float) -> str:
    h = int(seconds // 3600)
    m = int((seconds % 3600) // 60)
    s = seconds % 60
    if h:
        return f"{h}:{m:02d}:{s:06.3f}"
    return f"{m}:{s:06.3f}"


def _detail(
    key: str, label: str, starts: list[int], comps: list[str], total: float,
    laps: int, base: float, sev: float,
) -> dict:
    bounds = [*starts, laps]
    stints = []
    for si, c in enumerate(comps):
        comp = COMPOUNDS[c]
        stints.append({
            "compound": comp.key,
            "name": comp.name,
            "color": comp.color,
            "start_lap": bounds[si] + 1,
            "end_lap": bounds[si + 1],
            "laps": bounds[si + 1] - bounds[si],
        })
    return {
        "key": key,
        "label": label,
        "stops": len(comps) - 1,
        "stints": stints,
        "pits": [b for b in starts[1:]],
        "compound_sequence": [COMPOUNDS[c].name for c in comps],
        "total_time_s": round(total, 3),
        "total_time_str": _fmt(total),
        "avg_lap_s": round(total / laps, 3),
        "lap_pace": _lap_pace(starts, comps, laps, base, sev),
        "delta_s": 0.0,  # filled in by the caller relative to the optimum
    }


def list_circuits(db: Session) -> list[dict]:
    """Circuits we can simulate (have race pace), current-calendar first."""
    latest = db.execute(select(func.max(Race.season))).scalar()
    on_calendar = set(
        db.execute(select(Race.circuit_id).where(Race.season == latest)).scalars()
    )
    table = _pace_table(db)
    out = []
    for circuit in db.execute(select(Circuit)).scalars():
        params = _params(db, circuit)
        if params is None:
            continue
        laps, base, pit_loss, sev = params
        out.append({
            "circuit_ref": circuit.circuit_ref,
            "name": circuit.name,
            "country": circuit.country,
            "laps": laps,
            "base_lap_s": base,
            "pit_loss_s": pit_loss,
            "on_calendar": circuit.id in on_calendar,
            "has_pace": circuit.circuit_ref in table,
        })
    out.sort(key=lambda c: (not c["on_calendar"], c["name"]))
    return out


def _real_tyre(db: Session, circuit_id: int, race_laps: int) -> tuple[float | None, float | None]:
    """From FastF1 stints at this circuit: real avg pit stops + a severity
    multiplier calibrated from how much of the race a slick stint covers
    (shorter stints ⇒ harsher on tyres). Returns (avg_stops, severity|None)."""
    rows = db.execute(
        select(TyreStint.race_id, TyreStint.driver_id, TyreStint.laps, TyreStint.compound)
        .join(Race, Race.id == TyreStint.race_id)
        .where(Race.circuit_id == circuit_id)
    ).all()
    if not rows:
        return None, None
    counts: dict[tuple[int, int], int] = defaultdict(int)
    slick_lens: list[int] = []
    for rid, did, laps, compound in rows:
        counts[(rid, did)] += 1
        if compound in ("SOFT", "MEDIUM", "HARD") and laps:
            slick_lens.append(laps)
    avg_stops = round(median(counts.values()) - 1, 1) if counts else None
    sev = None
    if slick_lens and race_laps:
        frac = mean(slick_lens) / race_laps
        if frac > 0:
            # ~0.42 of the race per slick stint ≈ a 2-3 stop norm at severity 1.0
            sev = round(max(0.6, min(1.5, 0.42 / frac)), 2)
    return avg_stops, sev


def simulate(db: Session, circuit_ref: str, deg_mode: str = "normal") -> dict | None:
    circuit = db.execute(
        select(Circuit).where(Circuit.circuit_ref == circuit_ref)
    ).scalar_one_or_none()
    if circuit is None:
        return None
    params = _params(db, circuit)
    if params is None:
        return None
    laps, base, pit_loss, hand_sev = params
    real_stops, real_sev = _real_tyre(db, circuit.id, laps)
    base_sev = real_sev if real_sev is not None else hand_sev  # calibrate from real data
    sev = base_sev * DEG_MODE.get(deg_mode, 1.0)
    fuel_prefix, deg_cum = _build_tables(laps, sev)

    candidates: list[dict] = []
    for nstops, label in ((1, "1-stop"), (2, "2-stop"), (3, "3-stop")):
        found = _optimise(nstops, laps, base, pit_loss, fuel_prefix, deg_cum)
        if found is None:
            continue
        total, starts, comps = found
        candidates.append(_detail(label.lower(), label, starts, comps, total, laps, base, sev))

    if not candidates:
        return None
    best_total = min(c["total_time_s"] for c in candidates)
    optimal_key = next(c["key"] for c in candidates if c["total_time_s"] == best_total)
    for c in candidates:
        c["delta_s"] = round(c["total_time_s"] - best_total, 3)

    return {
        "circuit": {
            "circuit_ref": circuit.circuit_ref,
            "name": circuit.name,
            "country": circuit.country,
            "laps": laps,
            "base_lap_s": base,
            "base_lap_str": _fmt(base),
            "pit_loss_s": pit_loss,
            "deg_mode": deg_mode,
            "real_avg_stops": real_stops,
            "calibrated": real_sev is not None,
        },
        "compounds": [
            {"key": c.key, "name": c.name, "color": c.color, "offset": c.offset, "deg": c.deg}
            for c in COMPOUNDS.values()
        ],
        "optimal_key": optimal_key,
        "strategies": candidates,
    }
