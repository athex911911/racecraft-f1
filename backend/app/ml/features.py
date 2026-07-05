"""Feature engineering shared by the training pipeline and the live predictor.

One module, two callers: ``pipeline/train`` builds the training frame from it and
``app/services/predict`` builds the inference frame — the exact same pandas code
path, so there is no train/serve skew.

Leakage rules (the whole point of this file):
- every rolling/expanding feature is ``shift(1)``-ed within its group, so a row
  only ever sees races that finished *before* it;
- ``build_race_frame`` additionally drops the target race (and anything after
  it) from history, which makes backtests on completed races honest.

Grand-prix results only — sprints are deliberately ignored for form features to
keep the signal comparable across eras (documented trade-off, not an oversight).
"""

from __future__ import annotations

from dataclasses import dataclass

import numpy as np
import pandas as pd
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.f1 import QualifyingResult, Race, Result

# Canonical model inputs, in training order. Changing this list invalidates the
# saved artifacts — retrain via pipeline/train/train_models.py afterwards.
FEATURES: list[str] = [
    "grid",                 # starting slot (pit lane / unknown -> 20)
    "quali_pos",            # qualifying classification (falls back to grid)
    "form_finish_5",        # avg classified finish, last 5 GPs
    "form_points_5",        # avg points, last 5 GPs
    "gained_5",             # avg places gained grid->flag, last 5 classified GPs
    "dnf_rate_10",          # share of non-classified results, last 10 GPs
    "team_form_points_5",   # constructor pts/race (both cars), last 5 GPs
    "team_quali_5",         # constructor avg quali position, last 5 GPs
    "track_avg_finish",     # driver's avg classified finish at this circuit
    "track_starts",         # driver's previous starts at this circuit
    "career_starts",        # driver's previous GP starts overall
    "points_share_10",      # rolling-10 points vs the best scorer in the field
]

TARGETS: list[str] = ["win", "podium", "top10"]

# Neutral fill-ins for rookies / missing history, chosen as "anonymous midfield".
_DEFAULTS: dict[str, float] = {
    "grid": 20.0,
    "quali_pos": 20.0,
    "form_finish_5": 12.0,
    "form_points_5": 0.0,
    "gained_5": 0.0,
    "dnf_rate_10": 0.15,
    "team_form_points_5": 8.0,
    "team_quali_5": 11.0,
    "track_avg_finish": 12.0,
    "track_starts": 0.0,
    "career_starts": 0.0,
    "points_share_10": 0.0,
}


def _load_history(db: Session) -> pd.DataFrame:
    """Flat frame of every ingested GP result with race context + quali position."""
    rows = db.execute(
        select(
            Result.race_id,
            Race.season,
            Race.round,
            Race.date,
            Race.circuit_id,
            Result.driver_id,
            Result.constructor_id,
            Result.grid,
            QualifyingResult.position.label("quali_pos"),
            Result.position_text,
            Result.points,
        )
        .join(Race, Result.race_id == Race.id)
        .outerjoin(
            QualifyingResult,
            (QualifyingResult.race_id == Result.race_id)
            & (QualifyingResult.driver_id == Result.driver_id),
        )
    ).all()
    df = pd.DataFrame(
        rows,
        columns=[
            "race_id", "season", "round", "date", "circuit_id",
            "driver_id", "constructor_id", "grid", "quali_pos",
            "position_text", "points",
        ],
    )
    return _normalise(df)


def _normalise(df: pd.DataFrame) -> pd.DataFrame:
    df = df.copy()
    df["date"] = pd.to_datetime(df["date"])
    # numeric position_text == classified finish (Ergast convention: `position`
    # is always populated, DNFs are signalled by R/W/D text)
    df["finish"] = pd.to_numeric(df["position_text"], errors="coerce")
    df["classified"] = df["finish"].notna()
    # Ergast grid 0 == pit-lane start; treat missing the same way
    grid = pd.to_numeric(df["grid"], errors="coerce")
    df["grid_eff"] = grid.where(grid > 0, other=np.nan)
    df["quali_pos"] = pd.to_numeric(df["quali_pos"], errors="coerce")
    df["points"] = pd.to_numeric(df["points"], errors="coerce").fillna(0.0)
    return df


def _engineer(df: pd.DataFrame) -> pd.DataFrame:
    """Add the FEATURES columns. Input must contain history AND any synthetic
    target-race rows; everything is shift(1)-ed so appended rows only read the
    past."""
    df = df.sort_values(["date", "race_id", "driver_id"]).reset_index(drop=True)

    fin_cls = df["finish"].where(df["classified"])
    df["_fin_cls"] = fin_cls
    df["_gained"] = (df["grid_eff"] - df["finish"]).where(df["classified"])
    df["_dnf"] = (~df["classified"]).astype(float)

    g = df.groupby("driver_id", sort=False)

    def roll(col: str, window: int, agg: str = "mean") -> pd.Series:
        return g[col].transform(
            lambda s: getattr(s.shift(1).rolling(window, min_periods=1), agg)()
        )

    df["form_finish_5"] = roll("_fin_cls", 5)
    df["form_points_5"] = roll("points", 5)
    df["gained_5"] = roll("_gained", 5)
    df["dnf_rate_10"] = roll("_dnf", 10)
    df["career_starts"] = g.cumcount().astype(float)
    # recent single-lap pace, used both as model input fallback and for
    # estimating a grid when qualifying hasn't happened yet
    df["quali_form_3"] = g["quali_pos"].transform(
        lambda s: s.shift(1).rolling(3, min_periods=1).mean()
    )

    # constructor form: aggregate per (team, race), roll over the team's races
    team = (
        df.groupby(["constructor_id", "race_id"], as_index=False)
        .agg(date=("date", "first"), team_pts=("points", "sum"), team_q=("quali_pos", "mean"))
        .sort_values(["date", "race_id"])
    )
    tg = team.groupby("constructor_id", sort=False)
    team["team_form_points_5"] = tg["team_pts"].transform(
        lambda s: s.shift(1).rolling(5, min_periods=1).mean()
    )
    team["team_quali_5"] = tg["team_q"].transform(
        lambda s: s.shift(1).rolling(5, min_periods=1).mean()
    )
    df = df.merge(
        team[["constructor_id", "race_id", "team_form_points_5", "team_quali_5"]],
        on=["constructor_id", "race_id"],
        how="left",
    )

    # circuit-specific record
    tk = df.groupby(["driver_id", "circuit_id"], sort=False)
    df["track_starts"] = tk.cumcount().astype(float)
    df["track_avg_finish"] = tk["_fin_cls"].transform(
        lambda s: s.shift(1).expanding(min_periods=1).mean()
    )

    # championship pace: rolling-10 points vs the strongest rolling-10 in the race
    df["_pts10"] = g["points"].transform(
        lambda s: s.shift(1).rolling(10, min_periods=1).sum()
    )
    race_best = df.groupby("race_id")["_pts10"].transform("max")
    df["points_share_10"] = np.where(race_best > 0, df["_pts10"] / race_best, 0.0)

    # model input columns for the current race
    df["grid"] = df["grid_eff"]
    df["quali_pos"] = df["quali_pos"].fillna(df["grid_eff"])

    # fallback chain: no circuit history -> current form -> anonymous midfield
    df["track_avg_finish"] = df["track_avg_finish"].fillna(df["form_finish_5"])
    for col, default in _DEFAULTS.items():
        df[col] = df[col].fillna(default)

    return df.drop(columns=["_fin_cls", "_gained", "_dnf", "_pts10"])


def build_training_frame(db: Session) -> pd.DataFrame:
    """One row per (completed GP, entrant) with FEATURES + TARGETS."""
    df = _engineer(_load_history(db))
    fin = df["finish"]
    df["win"] = (fin == 1).astype(int)
    df["podium"] = (fin <= 3).astype(int)
    df["top10"] = (fin <= 10).astype(int)
    keep = ["race_id", "season", "round", "date", "driver_id", "constructor_id",
            "finish", *FEATURES, *TARGETS]
    return df[keep]


@dataclass
class RaceFrame:
    """Inference rows for a single race, plus how the grid was sourced."""

    race: Race
    frame: pd.DataFrame        # FEATURES + driver_id/constructor_id/grid
    grid_source: str           # "official" | "qualifying" | "estimated"
    completed: bool
    actuals: dict[int, tuple[int | None, str | None]]  # driver_id -> (finish, position_text)


def _entrants(db: Session, race: Race, history: pd.DataFrame):
    """Resolve who lines up for `race` and any known grid, best source first."""
    results = db.execute(
        select(Result.driver_id, Result.constructor_id, Result.grid,
               Result.position_text)
        .where(Result.race_id == race.id)
    ).all()
    if results:  # completed race -> real grid, and actuals for the backtest view
        actuals = {
            d: (int(pt) if pt and pt.isdigit() else None, pt)
            for d, _, _, pt in results
        }
        rows = [(d, c, g) for d, c, g, _ in results]
        return rows, "official", True, actuals

    quali = db.execute(
        select(QualifyingResult.driver_id, QualifyingResult.constructor_id,
               QualifyingResult.position)
        .where(QualifyingResult.race_id == race.id)
    ).all()
    if quali:
        return [(d, c, p) for d, c, p in quali], "qualifying", False, {}

    # nothing ingested for this race yet: project the latest lineup forward
    season_hist = history[history["season"] == race.season]
    pool = season_hist if not season_hist.empty else history
    last_race_id = pool.loc[pool["date"].idxmax(), "race_id"]
    lineup = pool[pool["race_id"] == last_race_id]
    rows = [(int(r.driver_id), int(r.constructor_id), None) for r in lineup.itertuples()]
    return rows, "estimated", False, {}


def build_race_frames(db: Session, races: list[Race]) -> list[RaceFrame]:
    """Batch variant of build_race_frame sharing a single history load.

    Each race is still engineered against its own past only — future races are
    NOT appended together, because their placeholder rows (0 points, no finish)
    would pollute each other's rolling-form windows.
    """
    full = _load_history(db)
    return [_race_frame(db, race, full) for race in races]


def build_race_frame(db: Session, race: Race) -> RaceFrame:
    """Feature rows for one race using only information available before it."""
    return _race_frame(db, race, _load_history(db))


def _race_frame(db: Session, race: Race, full: pd.DataFrame) -> RaceFrame:
    history = full[(full["date"] < pd.Timestamp(race.date)) & (full["race_id"] != race.id)]
    if history.empty:
        raise ValueError("no ingested history before this race")

    entrants, grid_source, completed, actuals = _entrants(db, race, history)

    synthetic = pd.DataFrame(
        {
            "race_id": race.id,
            "season": race.season,
            "round": race.round,
            "date": pd.Timestamp(race.date),
            "circuit_id": race.circuit_id,
            "driver_id": [d for d, _, _ in entrants],
            "constructor_id": [c for _, c, _ in entrants],
            "grid": [g for _, _, g in entrants],
            "quali_pos": [g if grid_source == "qualifying" else None for _, _, g in entrants],
            "position_text": None,
            "points": 0.0,
        }
    )
    combined = _engineer(pd.concat([history, _normalise(synthetic)], ignore_index=True))
    rows = combined[combined["race_id"] == race.id].copy()

    if grid_source == "estimated":
        # order the field by recent one-lap pace; unknowns go to the back
        order = rows["quali_form_3"].fillna(99.0)
        rows["grid"] = order.rank(method="first").astype(float)
        rows["quali_pos"] = rows["grid"]

    keep = ["driver_id", "constructor_id", *FEATURES]
    return RaceFrame(
        race=race,
        frame=rows[keep].reset_index(drop=True),
        grid_source=grid_source,
        completed=completed,
        actuals=actuals,
    )
