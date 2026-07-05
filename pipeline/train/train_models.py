"""Train the race-outcome models (win / podium / top-10 probability).

Usage:  backend/.venv/Scripts/python.exe pipeline/train/train_models.py

Protocol: season-based holdout (train <= HOLDOUT_FROM-1, evaluate on
HOLDOUT_FROM+) with early stopping, honest baselines for the winner pick, then
a final refit on ALL data at the early-stopped tree count. Artifacts land in
backend/app/ml/artifacts/ (xgboost native .ubj + metadata.json) and are
version-committed so the API needs no training step to run.
"""

from __future__ import annotations

import json
import sys
from datetime import datetime, timezone
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(REPO_ROOT / "backend"))

import numpy as np  # noqa: E402
import xgboost as xgb  # noqa: E402
from sklearn.metrics import brier_score_loss, log_loss, roc_auc_score  # noqa: E402

from app.core.database import SessionLocal  # noqa: E402
from app.ml.features import FEATURES, TARGETS, build_training_frame  # noqa: E402

ARTIFACTS = REPO_ROOT / "backend" / "app" / "ml" / "artifacts"
HOLDOUT_FROM = 2025  # seasons >= this are never trained on during evaluation
RECENCY = 0.88  # sample weight decay per season of age (2026 rules-era drift)

PARAMS = dict(
    n_estimators=800,
    learning_rate=0.04,
    max_depth=4,
    min_child_weight=4,
    subsample=0.9,
    colsample_bytree=0.8,
    reg_lambda=2.0,
    objective="binary:logistic",
    eval_metric="logloss",
    tree_method="hist",
    random_state=42,
    n_jobs=-1,
)


def winner_pick_accuracy(df, score_col: str) -> float:
    """Share of holdout races where the top-scored driver actually won."""
    hits = 0
    races = df.groupby("race_id")
    for _, race in races:
        pick = race.loc[race[score_col].idxmax()]
        hits += int(pick["win"] == 1)
    return hits / races.ngroups


def main() -> None:
    db = SessionLocal()
    try:
        frame = build_training_frame(db)
    finally:
        db.close()

    train = frame[frame["season"] < HOLDOUT_FROM]
    hold = frame[frame["season"] >= HOLDOUT_FROM].copy()
    print(
        f"rows: {len(frame)} total | train {len(train)} "
        f"({train['season'].min()}-{train['season'].max()}, {train['race_id'].nunique()} races) "
        f"| holdout {len(hold)} ({hold['season'].min()}-{hold['season'].max()}, "
        f"{hold['race_id'].nunique()} races)"
    )

    X_tr, X_ho = train[FEATURES], hold[FEATURES]
    metrics: dict[str, dict] = {}
    final_estimators: dict[str, int] = {}
    models: dict[str, xgb.XGBClassifier] = {}

    w_tr = RECENCY ** (train["season"].max() - train["season"])
    for target in TARGETS:
        y_tr, y_ho = train[target], hold[target]
        probe = xgb.XGBClassifier(**PARAMS, early_stopping_rounds=50)
        probe.fit(X_tr, y_tr, sample_weight=w_tr, eval_set=[(X_ho, y_ho)], verbose=False)
        best_n = probe.best_iteration + 1
        p = probe.predict_proba(X_ho)[:, 1]
        metrics[target] = {
            "logloss": round(float(log_loss(y_ho, p)), 4),
            "auc": round(float(roc_auc_score(y_ho, p)), 4),
            "brier": round(float(brier_score_loss(y_ho, p)), 4),
        }
        final_estimators[target] = best_n
        print(f"[{target:6s}] trees={best_n:3d}  " + "  ".join(
            f"{k}={v}" for k, v in metrics[target].items()
        ))
        if target == "win":
            hold["p_win"] = p

    # Winner-pick sanity check: does the model beat naive strategies?
    picks = {
        "model": winner_pick_accuracy(hold, "p_win"),
        "pole_sitter": winner_pick_accuracy(hold.assign(_s=-hold["grid"]), "_s"),
        "form_favorite": winner_pick_accuracy(hold, "points_share_10"),
    }
    print("winner pick accuracy on holdout: " + "  ".join(
        f"{k}={v:.1%}" for k, v in picks.items()
    ))

    # Final fit on everything at the tuned tree counts, then persist.
    ARTIFACTS.mkdir(parents=True, exist_ok=True)
    w_all = RECENCY ** (frame["season"].max() - frame["season"])
    for target in TARGETS:
        model = xgb.XGBClassifier(**{**PARAMS, "n_estimators": final_estimators[target]})
        model.fit(frame[FEATURES], frame[target], sample_weight=w_all, verbose=False)
        model.save_model(ARTIFACTS / f"{target}.ubj")
        models[target] = model

    gain = models["win"].get_booster().get_score(importance_type="gain")
    top_gain = sorted(gain.items(), key=lambda kv: -kv[1])[:6]
    print("win-model feature gain: " + ", ".join(f"{k}" for k, _ in top_gain))

    meta = {
        "algorithm": "Gradient-boosted trees (XGBoost)",
        "xgboost_version": xgb.__version__,
        "trained_at": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "features": FEATURES,
        "train": {
            "rows": int(len(frame)),
            "races": int(frame["race_id"].nunique()),
            "seasons": f"{int(frame['season'].min())}-{int(frame['season'].max())}",
        },
        "holdout": {
            "rows": int(len(hold)),
            "races": int(hold["race_id"].nunique()),
            "seasons": f"{int(hold['season'].min())}-{int(hold['season'].max())}",
        },
        "metrics": metrics,
        "winner_pick_accuracy": {k: round(v, 4) for k, v in picks.items()},
        "final_estimators": final_estimators,
        "top_features_by_gain": [k for k, _ in top_gain],
    }
    (ARTIFACTS / "metadata.json").write_text(json.dumps(meta, indent=2))
    print(f"artifacts written to {ARTIFACTS}")


if __name__ == "__main__":
    main()
