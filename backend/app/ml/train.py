"""
Train and evaluate Logistic Regression, Random Forest, and XGBoost models.

Usage:
    python -m app.ml.train

All models use the same stratified split and the same preprocessing pipeline.
Models and metadata are persisted to the `models/` directory.
"""
from __future__ import annotations

import json
import logging
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, Any

import joblib
import numpy as np
import pandas as pd
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier
from sklearn.pipeline import Pipeline
from sklearn.metrics import (
    accuracy_score,
    classification_report,
    confusion_matrix,
    f1_score,
    precision_score,
    recall_score,
    roc_auc_score,
)
from xgboost import XGBClassifier

from app.ml.dataset import (
    load_dataset,
    clean_dataset,
    binarize_target,
    stratified_split,
    describe_dataset,
    FEATURE_NAMES,
)
from app.ml.preprocessing import build_preprocessor
from app.core.config import settings

logger = logging.getLogger(__name__)

DATA_DIR = settings.model_dir.parent / "data"
MODEL_DIR = settings.model_dir
RESULTS_DIR = settings.results_dir
RANDOM_SEED = settings.random_seed


def _build_pipelines(seed: int = 42) -> Dict[str, Pipeline]:
    """Return one end-to-end sklearn Pipeline per model."""
    preprocessor = build_preprocessor()

    lr = Pipeline([
        ("preprocessor", build_preprocessor()),
        ("classifier", LogisticRegression(
            max_iter=1000,
            random_state=seed,
            class_weight="balanced",
            solver="lbfgs",
        )),
    ])

    rf = Pipeline([
        ("preprocessor", build_preprocessor()),
        ("classifier", RandomForestClassifier(
            n_estimators=200,
            random_state=seed,
            class_weight="balanced",
            n_jobs=-1,
        )),
    ])

    xgb = Pipeline([
        ("preprocessor", build_preprocessor()),
        ("classifier", XGBClassifier(
            n_estimators=200,
            random_state=seed,
            use_label_encoder=False,
            eval_metric="logloss",
            scale_pos_weight=1,   # will be updated after split
            n_jobs=-1,
            verbosity=0,
        )),
    ])

    return {"logistic_regression": lr, "random_forest": rf, "xgboost": xgb}


def evaluate_model(model: Pipeline, X_test: pd.DataFrame, y_test: pd.Series) -> Dict[str, Any]:
    y_pred = model.predict(X_test)
    y_prob = None
    if hasattr(model, "predict_proba"):
        y_prob = model.predict_proba(X_test)[:, 1]

    metrics: Dict[str, Any] = {
        "accuracy": float(accuracy_score(y_test, y_pred)),
        "precision": float(precision_score(y_test, y_pred, zero_division=0)),
        "recall": float(recall_score(y_test, y_pred, zero_division=0)),
        "f1": float(f1_score(y_test, y_pred, zero_division=0)),
        "roc_auc": float(roc_auc_score(y_test, y_prob)) if y_prob is not None else None,
        "confusion_matrix": confusion_matrix(y_test, y_pred).tolist(),
        "classification_report": classification_report(y_test, y_pred, output_dict=True),
        "n_test_samples": int(len(y_test)),
        "n_positive_test": int(y_test.sum()),
    }
    return metrics


def train_all(
    data_dir: Path = DATA_DIR,
    model_dir: Path = MODEL_DIR,
    results_dir: Path = RESULTS_DIR,
    seed: int = RANDOM_SEED,
) -> Dict[str, Dict[str, Any]]:
    """
    Full training workflow:
      1. Load & clean dataset.
      2. Binarise target.
      3. Stratified split.
      4. Fit three pipelines.
      5. Evaluate and persist each.
    """
    data_dir.mkdir(parents=True, exist_ok=True)
    model_dir.mkdir(parents=True, exist_ok=True)
    results_dir.mkdir(parents=True, exist_ok=True)

    logger.info("Loading dataset…")
    df_raw = load_dataset(data_dir)
    df = clean_dataset(df_raw)
    X, y = binarize_target(df)

    logger.info("Dataset: %d records, %d features, target distribution: %s",
                len(X), len(FEATURE_NAMES), dict(y.value_counts()))

    X_train, X_test, y_train, y_test = stratified_split(X, y, random_state=seed)
    logger.info("Train: %d  Test: %d", len(X_train), len(X_test))

    # Adjust XGBoost scale_pos_weight
    neg_count = int((y_train == 0).sum())
    pos_count = int((y_train == 1).sum())
    scale_pos_weight = neg_count / max(pos_count, 1)

    pipelines = _build_pipelines(seed)
    pipelines["xgboost"].named_steps["classifier"].scale_pos_weight = scale_pos_weight

    all_metrics: Dict[str, Dict[str, Any]] = {}
    dataset_info = describe_dataset(X, y)

    training_meta = {
        "training_date": datetime.now(timezone.utc).isoformat(),
        "random_seed": seed,
        "train_size": len(X_train),
        "test_size": len(X_test),
        "split_strategy": "stratified",
        "dataset": {
            "source": "UCI ML Repository — Heart Disease, ID 45",
            "subset": "Cleveland",
            "url": "https://archive.ics.uci.edu/dataset/45/heart+disease",
            **dataset_info,
        },
        "target_definition": {
            "original_column": "num",
            "binary_encoding": "0 → class 0 (no disease); 1-4 → class 1 (disease present)",
        },
    }

    for name, pipeline in pipelines.items():
        logger.info("Training %s…", name)
        pipeline.fit(X_train, y_train)

        metrics = evaluate_model(pipeline, X_test, y_test)
        metrics["model_name"] = name
        metrics["model_version"] = "1.0.0"
        metrics.update(training_meta)

        # Save pipeline
        pipeline_path = model_dir / f"{name}_pipeline.joblib"
        joblib.dump(pipeline, pipeline_path)
        logger.info("Saved pipeline → %s", pipeline_path)

        # Save metrics JSON
        metrics_path = results_dir / f"{name}_metrics.json"
        with open(metrics_path, "w") as f:
            json.dump(metrics, f, indent=2, default=str)
        logger.info(
            "%s — Accuracy=%.3f  Recall=%.3f  ROC-AUC=%.3f",
            name,
            metrics["accuracy"],
            metrics["recall"],
            metrics.get("roc_auc") or 0,
        )
        all_metrics[name] = metrics

    # Save combined metrics
    combined_path = results_dir / "all_metrics.json"
    with open(combined_path, "w") as f:
        json.dump(all_metrics, f, indent=2, default=str)

    logger.info("Training complete. Metrics saved to %s", results_dir)
    return all_metrics


if __name__ == "__main__":
    import sys
    logging.basicConfig(
        stream=sys.stdout,
        level=logging.INFO,
        format="%(asctime)s | %(levelname)s | %(message)s",
    )
    train_all()
