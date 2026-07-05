"""Loads the trained race-outcome models once and serves predictions.

Artifacts are produced by pipeline/train/train_models.py and committed to
artifacts/, so a fresh clone can serve predictions without training.
"""

from __future__ import annotations

import json
from functools import lru_cache
from pathlib import Path

import numpy as np
import pandas as pd
import xgboost as xgb

from app.ml.features import FEATURES, TARGETS

ARTIFACTS = Path(__file__).resolve().parent / "artifacts"


class ModelBundle:
    def __init__(self) -> None:
        meta_path = ARTIFACTS / "metadata.json"
        if not meta_path.exists():
            raise RuntimeError(
                "ML artifacts missing — run pipeline/train/train_models.py first"
            )
        self.metadata: dict = json.loads(meta_path.read_text())
        self.models: dict[str, xgb.XGBClassifier] = {}
        for target in TARGETS:
            model = xgb.XGBClassifier()
            model.load_model(ARTIFACTS / f"{target}.ubj")
            self.models[target] = model

    def predict(self, frame: pd.DataFrame) -> dict[str, np.ndarray]:
        """P(target) per row for each of win/podium/top10."""
        X = frame[FEATURES]
        return {t: m.predict_proba(X)[:, 1] for t, m in self.models.items()}

    def win_contributions(self, frame: pd.DataFrame) -> np.ndarray:
        """Per-feature logit contributions for the win model (native XGBoost
        SHAP-style attribution; last column is the bias term)."""
        dmatrix = xgb.DMatrix(frame[FEATURES])
        return self.models["win"].get_booster().predict(dmatrix, pred_contribs=True)


@lru_cache(maxsize=1)
def get_bundle() -> ModelBundle:
    return ModelBundle()
