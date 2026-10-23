"""
SHAP explainability module.

Supports:
  - Tree-based models (Random Forest, XGBoost) -> TreeExplainer
  - Linear models (Logistic Regression) -> LinearExplainer
  - Fallback -> KernelExplainer (used only when others are unavailable)

Returns JSON-serialisable results for API consumption.
"""
from __future__ import annotations

import logging
from typing import Any, Dict, List, Optional

import numpy as np
import pandas as pd
import shap
from sklearn.pipeline import Pipeline

from app.ml.preprocessing import get_feature_names

logger = logging.getLogger(__name__)

TOP_N = 10


def _get_classifier(pipeline: Pipeline):
    """Extract the final estimator from a sklearn Pipeline."""
    return pipeline.named_steps.get("classifier") or pipeline.steps[-1][1]


def _get_preprocessor(pipeline: Pipeline):
    return pipeline.named_steps.get("preprocessor") or pipeline.steps[0][1]


def _make_explainer(classifier, X_transformed: np.ndarray):
    """Select the most appropriate SHAP explainer for the given classifier."""
    class_name = type(classifier).__name__

    if class_name in ("RandomForestClassifier", "XGBClassifier", "GradientBoostingClassifier"):
        logger.info("Using TreeExplainer for %s", class_name)
        return shap.TreeExplainer(classifier)

    if class_name in ("LogisticRegression", "LinearSVC"):
        logger.info("Using LinearExplainer for %s", class_name)
        return shap.LinearExplainer(classifier, X_transformed)

    logger.info("Falling back to KernelExplainer for %s", class_name)
    background = shap.kmeans(X_transformed, min(10, X_transformed.shape[0]))
    return shap.KernelExplainer(
        lambda x: classifier.predict_proba(x)[:, 1], background
    )


def _extract_positive_class_shap(shap_values: Any) -> np.ndarray:
    """
    Normalise SHAP values into a 2D array of shape (n_samples, n_features)
    representing the positive class (class 1).
    """
    if isinstance(shap_values, list):
        # List of arrays [class0, class1]
        arr = shap_values[1] if len(shap_values) > 1 else shap_values[0]
        return np.asarray(arr)
    
    arr = np.asarray(shap_values)
    if arr.ndim == 3:
        # Shape: (n_samples, n_features, n_classes)
        return arr[:, :, 1] if arr.shape[2] > 1 else arr[:, :, 0]
    
    return arr


def compute_global_importance(
    pipeline: Pipeline,
    X_train: pd.DataFrame,
) -> Dict[str, Any]:
    """
    Compute mean |SHAP| values over the training set.
    Returns a dict with feature names and importance scores.
    """
    try:
        preprocessor = _get_preprocessor(pipeline)
        classifier = _get_classifier(pipeline)

        X_trans = preprocessor.transform(X_train)
        feature_names = get_feature_names(preprocessor)

        explainer = _make_explainer(classifier, X_trans)
        raw_shap = explainer.shap_values(X_trans)
        sv = _extract_positive_class_shap(raw_shap)

        mean_abs = np.abs(sv).mean(axis=0)
        importance = dict(zip(feature_names, mean_abs.tolist()))
        top_features = sorted(importance.items(), key=lambda x: x[1], reverse=True)[:TOP_N]

        return {
            "status": "ok",
            "top_features": [{"feature": k, "importance": float(v)} for k, v in top_features],
            "all_features": {k: float(v) for k, v in importance.items()},
        }
    except Exception as exc:
        logger.error("SHAP global importance failed: %s", exc, exc_info=True)
        return {"status": "error", "message": str(exc), "top_features": []}


def compute_local_explanation(
    pipeline: Pipeline,
    X_train: pd.DataFrame,
    input_dict: dict,
) -> Dict[str, Any]:
    """
    Compute SHAP values for a single prediction input.
    Returns feature contributions with direction.
    """
    try:
        from app.ml.dataset import FEATURE_NAMES

        preprocessor = _get_preprocessor(pipeline)
        classifier = _get_classifier(pipeline)

        X_input = pd.DataFrame([input_dict])[FEATURE_NAMES]
        X_input_trans = preprocessor.transform(X_input)
        feature_names = get_feature_names(preprocessor)

        X_train_trans = preprocessor.transform(X_train)
        explainer = _make_explainer(classifier, X_train_trans)

        raw_shap = explainer.shap_values(X_input_trans)
        sv_matrix = _extract_positive_class_shap(raw_shap)
        sv = sv_matrix[0]  # First and only sample

        contributions = []
        for feat, val, orig in zip(feature_names, sv.tolist(), X_input_trans[0].tolist()):
            contributions.append({
                "feature": feat,
                "shap_value": float(val),
                "feature_value": float(orig),
                "direction": "positive" if val > 0 else "negative",
            })

        contributions.sort(key=lambda x: abs(x["shap_value"]), reverse=True)

        # Base value extraction
        base_val = explainer.expected_value
        if isinstance(base_val, (list, np.ndarray)):
            base_value_float = float(base_val[1]) if len(base_val) > 1 else float(base_val[0])
        else:
            base_value_float = float(base_val)

        return {
            "status": "ok",
            "contributions": contributions[:TOP_N],
            "base_value": base_value_float,
        }

    except Exception as exc:
        logger.error("SHAP local explanation failed: %s", exc, exc_info=True)
        return {"status": "error", "message": str(exc), "contributions": []}
