"""Race-outcome predictions and the championship Monte Carlo.

Real models, honest presentation: probabilities come from the committed XGBoost
artifacts (see pipeline/train/train_models.py), explanation chips are rendered
from the win model's native per-feature contributions (no hand-waving), and the
title simulation is a Plackett–Luce Monte Carlo seeded with per-race win
probabilities — DNF luck is implicit in the sampling spread, not modelled
separately.
"""

from __future__ import annotations

import math
from datetime import date as date_cls

import numpy as np
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.ml.features import FEATURES, RaceFrame, build_race_frame, build_race_frames
from app.ml.predictor import get_bundle
from app.models.f1 import Constructor, Driver, DriverStanding, Race, Result
from app.schemas.f1 import (
    ChampionshipSimOut,
    CircuitOut,
    ConstructorOut,
    PredictionFactor,
    PredictModelInfo,
    RacePredictionEntry,
    RacePredictionOut,
    TitleContender,
)
from app.services.dashboard import _driver_out

# 2026 scoring: 25..1 for the GP top ten (no fastest-lap point since 2025),
# 8..1 for the sprint top eight.
_GP_POINTS = [25.0, 18.0, 15.0, 12.0, 10.0, 8.0, 6.0, 4.0, 2.0, 1.0]
_SPRINT_POINTS = [8.0, 7.0, 6.0, 5.0, 4.0, 3.0, 2.0, 1.0]

# Per-simulation log-strength noise: how much true pace may drift from today's
# form over the rest of the season (car development, upgrades, reliability).
# Without it every simulated season crowns the same champion and the title
# probabilities collapse to 0/100%.
_STRENGTH_SIGMA = 0.9

_IDX = {name: i for i, name in enumerate(FEATURES)}


def _resolve_race(db: Session, race_id: int | None) -> Race | None:
    if race_id is not None:
        return db.get(Race, race_id)
    race = db.execute(
        select(Race).where(Race.date >= date_cls.today()).order_by(Race.date).limit(1)
    ).scalar_one_or_none()
    if race is None:  # season over -> latest race as a backtest default
        race = db.execute(select(Race).order_by(Race.date.desc()).limit(1)).scalar_one_or_none()
    return race


def _factor_text(key: str, value: float) -> str:
    if key == "start":
        return f"Starts P{int(round(value))}"
    if key == "form_finish_5":
        return f"Averaging P{value:.1f} over the last five races"
    if key == "form_points_5":
        return f"{value:.1f} pts per race of late"
    if key == "gained_5":
        if value >= 0.05:
            return f"Typically gains {value:.1f} places on Sunday"
        if value <= -0.05:
            return f"Typically drops {abs(value):.1f} places on Sunday"
        return "Usually finishes where they start"
    if key == "dnf_rate_10":
        n = int(round(value * 10))
        return "No DNFs in the last ten races" if n == 0 else f"{n} DNF{'s' if n > 1 else ''} in the last ten"
    if key == "team_form_points_5":
        return f"Team scoring {value:.1f} pts per round"
    if key == "team_quali_5":
        return f"The car qualifies ~P{value:.1f}"
    if key == "track_avg_finish":
        return f"Averages P{value:.1f} at this circuit"
    if key == "track_starts":
        n = int(value)
        return "First start at this circuit" if n == 0 else f"{n} previous start{'s' if n > 1 else ''} here"
    if key == "career_starts":
        n = int(value)
        return "Grand Prix debut" if n == 0 else f"{n} career starts"
    if key == "points_share_10":
        return f"Scoring at {value:.0%} of the pace-setter's rate"
    return key


def _row_factors(contrib_row: np.ndarray, feature_row: np.ndarray) -> list[PredictionFactor]:
    """Top drivers of the win probability for one entry, from model attributions.

    ``grid`` and ``quali_pos`` are merged into a single "start" factor — they
    describe the same thing to a reader.
    """
    merged: dict[str, tuple[float, float]] = {  # key -> (contribution, display value)
        "start": (
            contrib_row[_IDX["grid"]] + contrib_row[_IDX["quali_pos"]],
            feature_row[_IDX["grid"]],
        )
    }
    for name in FEATURES:
        if name in ("grid", "quali_pos"):
            continue
        merged[name] = (contrib_row[_IDX[name]], feature_row[_IDX[name]])

    ranked = sorted(merged.items(), key=lambda kv: -abs(kv[1][0]))
    factors = [
        PredictionFactor(text=_factor_text(key, val), positive=contrib > 0)
        for key, (contrib, val) in ranked
        if abs(contrib) >= 0.08
    ][:3]
    if len(factors) < 2:  # always give the reader something concrete
        factors = [
            PredictionFactor(text=_factor_text(k, v), positive=c > 0)
            for k, (c, v) in ranked[:2]
        ]
    return factors


def _model_info() -> PredictModelInfo:
    meta = get_bundle().metadata
    metrics = meta.get("metrics", {})
    return PredictModelInfo(
        algorithm=meta.get("algorithm", "Gradient-boosted trees"),
        trained_at=meta.get("trained_at"),
        train_seasons=meta.get("train", {}).get("seasons"),
        holdout_seasons=meta.get("holdout", {}).get("seasons"),
        holdout_races=meta.get("holdout", {}).get("races"),
        auc_win=metrics.get("win", {}).get("auc"),
        auc_podium=metrics.get("podium", {}).get("auc"),
        winner_pick_rate=meta.get("winner_pick_accuracy", {}).get("model"),
        features=meta.get("features", FEATURES),
    )


def race_prediction(db: Session, race_id: int | None = None) -> RacePredictionOut | None:
    race = _resolve_race(db, race_id)
    if race is None:
        return None
    rf = build_race_frame(db, race)
    bundle = get_bundle()
    probs = bundle.predict(rf.frame)
    contribs = bundle.win_contributions(rf.frame)

    win_raw = probs["win"]
    share = win_raw / win_raw.sum() if win_raw.sum() > 0 else np.full(len(win_raw), 1 / len(win_raw))

    ids = rf.frame["driver_id"].astype(int).tolist()
    drivers = {
        d.id: d for d in db.execute(select(Driver).where(Driver.id.in_(ids))).scalars()
    }
    team_ids = rf.frame["constructor_id"].astype(int).tolist()
    teams = {
        c.id: c
        for c in db.execute(select(Constructor).where(Constructor.id.in_(team_ids))).scalars()
    }

    feature_matrix = rf.frame[FEATURES].to_numpy()
    entries = []
    for i in range(len(rf.frame)):
        driver_id = int(rf.frame.loc[i, "driver_id"])
        actual, actual_text = rf.actuals.get(driver_id, (None, None))
        team = teams.get(int(rf.frame.loc[i, "constructor_id"]))
        entries.append(
            RacePredictionEntry(
                driver=_driver_out(drivers[driver_id]),
                constructor=ConstructorOut.model_validate(team) if team else None,
                grid=int(round(float(rf.frame.loc[i, "grid"]))),
                win_prob=round(float(share[i]), 4),
                podium_prob=round(float(probs["podium"][i]), 4),
                top10_prob=round(float(probs["top10"][i]), 4),
                factors=_row_factors(contribs[i], feature_matrix[i]),
                actual_position=actual,
                actual_text=actual_text,
            )
        )
    entries.sort(key=lambda e: -e.win_prob)

    entropy = -sum(p * math.log(p) for p in share if p > 0)
    certainty = 1.0 - entropy / math.log(len(share)) if len(share) > 1 else 1.0

    return RacePredictionOut(
        race_id=race.id,
        season=race.season,
        round=race.round,
        name=race.name,
        date=race.date,
        circuit=CircuitOut.model_validate(race.circuit),
        completed=rf.completed,
        grid_source=rf.grid_source,
        certainty=round(certainty, 4),
        model=_model_info(),
        entries=entries,
    )


# --- Championship Monte Carlo -------------------------------------------------

_SIM_CACHE: dict[tuple[int, int], ChampionshipSimOut] = {}


def _points_lookup(base: list[float], n: int) -> np.ndarray:
    table = np.zeros(n, dtype=float)
    table[: min(len(base), n)] = base[: min(len(base), n)]
    return table


def championship_simulation(db: Session, iterations: int = 4000) -> ChampionshipSimOut | None:
    completed_ids = select(Result.race_id).distinct()
    latest = db.execute(
        select(Race).where(Race.id.in_(completed_ids)).order_by(Race.date.desc()).limit(1)
    ).scalar_one_or_none()
    if latest is None:
        return None

    cache_key = (latest.id, iterations)
    if cache_key in _SIM_CACHE:
        return _SIM_CACHE[cache_key]

    season = latest.season
    season_races = db.execute(
        select(Race).where(Race.season == season).order_by(Race.round)
    ).scalars().all()
    done = {
        rid
        for (rid,) in db.execute(
            select(Result.race_id).join(Race, Result.race_id == Race.id).where(Race.season == season).distinct()
        )
    }
    remaining = [r for r in season_races if r.id not in done]

    standings = db.execute(
        select(DriverStanding).where(DriverStanding.race_id == latest.id)
    ).scalars().all()
    current_pts = {s.driver_id: s.points for s in standings}
    current_pos = {s.driver_id: s.position for s in standings}

    # win-probability weights per remaining race (estimated grids)
    bundle = get_bundle()
    race_frames: list[tuple[Race, RaceFrame, np.ndarray]] = []
    for race, rf in zip(remaining, build_race_frames(db, remaining)):
        p = bundle.predict(rf.frame)["win"]
        race_frames.append((race, rf, p / p.sum() if p.sum() > 0 else p))

    all_ids: list[int] = sorted(
        set(current_pts)
        | {int(d) for _, rf, _ in race_frames for d in rf.frame["driver_id"]}
    )
    idx = {driver_id: i for i, driver_id in enumerate(all_ids)}
    n = len(all_ids)

    rng = np.random.default_rng(latest.id * 7919 + iterations)
    totals = np.tile(
        np.array([current_pts.get(d, 0.0) for d in all_ids]), (iterations, 1)
    )
    gp_table = _points_lookup(_GP_POINTS, n)
    sprint_table = _points_lookup(_SPRINT_POINTS, n)
    remaining_sprints = sum(1 for r in remaining if r.sprint is not None)

    # drawn once per simulated season, then persists across its races
    strength_noise = rng.normal(size=(iterations, n)) * _STRENGTH_SIGMA

    for race, rf, p in race_frames:
        weights = np.full(n, -1e9)  # absent drivers can't score
        for driver_id, prob in zip(rf.frame["driver_id"].astype(int), p):
            weights[idx[driver_id]] = math.log(max(float(prob), 1e-12))
        score = weights + strength_noise + rng.gumbel(size=(iterations, n))
        rank = (-score).argsort(axis=1).argsort(axis=1)  # 0 == wins the GP
        totals += gp_table[rank]
        if race.sprint is not None:
            sprint_score = weights + strength_noise + rng.gumbel(size=(iterations, n))
            sprint_rank = (-sprint_score).argsort(axis=1).argsort(axis=1)
            totals += sprint_table[sprint_rank]

    if race_frames:
        champions = totals.argmax(axis=1)
        title_prob = np.bincount(champions, minlength=n) / iterations
        final_rank = (-totals).argsort(axis=1).argsort(axis=1)
        top3_prob = (final_rank < 3).mean(axis=0)
        expected = totals.mean(axis=0)
    else:  # season finished — the table is the answer
        pts = totals[0]
        order = (-pts).argsort().argsort()
        title_prob = (order == 0).astype(float)
        top3_prob = (order < 3).astype(float)
        expected = pts

    drivers = {
        d.id: d for d in db.execute(select(Driver).where(Driver.id.in_(all_ids))).scalars()
    }
    # a driver's current team: their most recent entry this season
    team_rows = db.execute(
        select(Result.driver_id, Constructor)
        .join(Race, Result.race_id == Race.id)
        .join(Constructor, Result.constructor_id == Constructor.id)
        .where(Race.season == season)
        .order_by(Result.driver_id, Race.round.desc())
        .distinct(Result.driver_id)
    ).all()
    team_of = {driver_id: team for driver_id, team in team_rows}

    contenders = []
    for driver_id in all_ids:
        i = idx[driver_id]
        if driver_id not in drivers:
            continue
        team = team_of.get(driver_id)
        contenders.append(
            TitleContender(
                driver=_driver_out(drivers[driver_id]),
                constructor=ConstructorOut.model_validate(team) if team else None,
                current_points=float(current_pts.get(driver_id, 0.0)),
                current_position=current_pos.get(driver_id),
                title_prob=round(float(title_prob[i]), 4),
                top3_prob=round(float(top3_prob[i]), 4),
                expected_points=round(float(expected[i]), 1),
            )
        )
    contenders.sort(key=lambda c: (-c.title_prob, -c.current_points))

    out = ChampionshipSimOut(
        season=season,
        completed_rounds=len(done),
        total_rounds=len(season_races),
        remaining_sprints=remaining_sprints,
        iterations=iterations,
        contenders=contenders[:10],
    )
    _SIM_CACHE[cache_key] = out
    return out
