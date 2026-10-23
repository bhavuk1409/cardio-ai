"""
Scikit-learn preprocessing pipeline for the UCI Heart Disease dataset.

Principles
----------
* All learned transformations (imputers, scalers, encoders) are fitted on
  TRAINING data only — never on validation or test data.
* The pipeline is persisted alongside the model for reproducible inference.
* Categorical and ordinal variables are handled separately and documented.
"""
from __future__ import annotations

import logging
from typing import List

import numpy as np
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.impute import SimpleImputer
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler

from app.ml.dataset import CATEGORICAL_FEATURES, NUMERIC_FEATURES

logger = logging.getLogger(__name__)


# ──────────────────────────────────────────────────────────────────────────────
# Encoding notes
# ──────────────────────────────────────────────────────────────────────────────
# sex     : binary (0/1) — treated as numeric; no encoding needed
# cp      : 4 nominal categories — one-hot encoded
# fbs     : binary (0/1) — treated as numeric
# restecg : 3 ordinal-ish categories — one-hot encoded for simplicity; the
#           values 0,1,2 have documented clinical ordering but are encoded as
#           nominal here to avoid imposing an arbitrary ordinal distance.
# exang   : binary (0/1)
# slope   : 3 ordinal categories (1,2,3) — one-hot encoded
# ca      : 0–3 count variable — treated as numeric
# thal    : 3 nominal categories (3,6,7) — one-hot encoded
#
# age, trestbps, chol, thalach, oldpeak : continuous numeric → scaled

# Variables that will be passed through as-is (after imputation + scaling)
_PURE_NUMERIC = ["age", "trestbps", "chol", "thalach", "oldpeak"]

# Binary indicators treated as numeric (no scaling needed but we scale anyway
# for Logistic Regression coefficient comparability)
_BINARY_AS_NUMERIC = ["sex", "fbs", "exang", "ca"]

# All features that go through the numeric pipeline
NUMERIC_PIPELINE_FEATURES = _PURE_NUMERIC + _BINARY_AS_NUMERIC

# Features that are one-hot encoded
OHE_FEATURES = ["cp", "restecg", "slope", "thal"]


def build_preprocessor() -> ColumnTransformer:
    """
    Return a ColumnTransformer that:
      - Imputes numeric features with training-set median.
      - Scales numeric features with StandardScaler.
      - Imputes categorical features with training-set most-frequent value.
      - One-hot encodes categorical features (drop='if_binary' for true
        binary columns; handle_unknown='ignore' for safety).
    """
    numeric_pipeline = Pipeline(
        steps=[
            ("imputer", SimpleImputer(strategy="median")),
            ("scaler", StandardScaler()),
        ]
    )

    categorical_pipeline = Pipeline(
        steps=[
            ("imputer", SimpleImputer(strategy="most_frequent")),
            (
                "ohe",
                OneHotEncoder(
                    handle_unknown="ignore",
                    sparse_output=False,
                    drop=None,
                ),
            ),
        ]
    )

    preprocessor = ColumnTransformer(
        transformers=[
            ("num", numeric_pipeline, NUMERIC_PIPELINE_FEATURES),
            ("cat", categorical_pipeline, OHE_FEATURES),
        ],
        remainder="drop",
        verbose_feature_names_out=True,
    )
    return preprocessor


def get_feature_names(preprocessor: ColumnTransformer) -> List[str]:
    """Return the full list of feature names after transformation."""
    return list(preprocessor.get_feature_names_out())


def validate_input(data: dict) -> dict:
    """
    Validate a prediction input dict.
    Returns cleaned dict or raises ValueError with details.
    """
    from app.ml.dataset import FEATURE_NAMES

    errors = []
    cleaned = {}

    ranges = {
        "age": (1, 120),
        "sex": (0, 1),
        "cp": (1, 4),
        "trestbps": (50, 300),
        "chol": (100, 700),
        "fbs": (0, 1),
        "restecg": (0, 2),
        "thalach": (50, 250),
        "exang": (0, 1),
        "oldpeak": (0.0, 10.0),
        "slope": (1, 3),
        "ca": (0, 3),
        "thal": (3, 7),   # valid values: 3, 6, 7
    }

    for feat in FEATURE_NAMES:
        val = data.get(feat)
        if val is None:
            errors.append(f"'{feat}' is required.")
            continue
        try:
            val = float(val)
        except (ValueError, TypeError):
            errors.append(f"'{feat}' must be numeric, got '{data[feat]}'.")
            continue

        lo, hi = ranges.get(feat, (-np.inf, np.inf))
        if not (lo <= val <= hi):
            errors.append(f"'{feat}' value {val} is out of range [{lo}, {hi}].")
            continue

        cleaned[feat] = val

    if errors:
        raise ValueError("; ".join(errors))

    return cleaned
