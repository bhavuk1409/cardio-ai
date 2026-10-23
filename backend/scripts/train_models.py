#!/usr/bin/env python3
"""
Training script — run from backend/ directory with the venv active.

    python -m scripts.train_models

Trains Logistic Regression, Random Forest and XGBoost, saves pipelines
and metrics, and generates EDA and evaluation charts.
"""
from __future__ import annotations

import json
import logging
import sys
from pathlib import Path

# Add backend to path
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.core.config import settings
from app.core.logging import setup_logging
from app.ml.dataset import load_dataset, clean_dataset, binarize_target, stratified_split
from app.ml.eda import run_eda
from app.ml.train import train_all
from app.ml.evaluation import generate_all_eval_charts

setup_logging()
logger = logging.getLogger(__name__)


def main():
    logger.info("=== Training Pipeline Start ===")

    data_dir = settings.model_dir.parent / "data"
    model_dir = settings.model_dir
    results_dir = settings.results_dir
    eda_dir = results_dir / "eda"

    data_dir.mkdir(parents=True, exist_ok=True)
    model_dir.mkdir(parents=True, exist_ok=True)
    results_dir.mkdir(parents=True, exist_ok=True)
    eda_dir.mkdir(parents=True, exist_ok=True)

    # 1. Load and clean data
    logger.info("Step 1: Loading dataset…")
    df_raw = load_dataset(data_dir)
    df = clean_dataset(df_raw)
    X, y = binarize_target(df)

    # 2. EDA
    logger.info("Step 2: Running EDA…")
    eda_summary = run_eda(df, y, eda_dir)
    logger.info("EDA charts saved to %s", eda_dir)

    # 3. Train all models
    logger.info("Step 3: Training models…")
    all_metrics = train_all(data_dir, model_dir, results_dir, settings.random_seed)

    # 4. Generate evaluation charts
    logger.info("Step 4: Generating evaluation charts…")
    eval_dir = results_dir / "evaluation"
    eval_dir.mkdir(parents=True, exist_ok=True)
    generate_all_eval_charts(all_metrics, results_dir)

    # 5. Print summary
    print("\n" + "=" * 60)
    print("TRAINING COMPLETE — RESULTS SUMMARY")
    print("=" * 60)
    for name, metrics in all_metrics.items():
        print(f"\n{name.upper().replace('_', ' ')}")
        print(f"  Accuracy : {metrics['accuracy']:.4f}")
        print(f"  Precision: {metrics['precision']:.4f}")
        print(f"  Recall   : {metrics['recall']:.4f}")
        print(f"  F1       : {metrics['f1']:.4f}")
        roc = metrics.get('roc_auc')
        print(f"  ROC-AUC  : {roc:.4f}" if roc else "  ROC-AUC  : unavailable")
    print("\n" + "=" * 60)
    print(f"Models saved to:  {model_dir}")
    print(f"Metrics saved to: {results_dir}")
    print(f"EDA charts:       {eda_dir}")
    print("=" * 60 + "\n")


if __name__ == "__main__":
    main()
