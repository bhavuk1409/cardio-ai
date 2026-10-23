"""
Model evaluation — generate confusion matrix, ROC curve charts.
"""
from __future__ import annotations

import json
import logging
from pathlib import Path
from typing import Dict, Any

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
import seaborn as sns
from sklearn.metrics import RocCurveDisplay, confusion_matrix

logger = logging.getLogger(__name__)

MODEL_DISPLAY_NAMES = {
    "logistic_regression": "Logistic Regression",
    "random_forest": "Random Forest",
    "xgboost": "XGBoost",
}


def plot_confusion_matrix(cm: list, model_name: str, out_dir: Path) -> Path:
    cm_arr = np.array(cm)
    fig, ax = plt.subplots(figsize=(5, 4))
    sns.heatmap(
        cm_arr,
        annot=True,
        fmt="d",
        cmap="Blues",
        ax=ax,
        xticklabels=["Pred: No Disease", "Pred: Disease"],
        yticklabels=["True: No Disease", "True: Disease"],
        cbar=False,
    )
    ax.set_title(
        f"Confusion Matrix — {MODEL_DISPLAY_NAMES.get(model_name, model_name)}",
        fontsize=12,
        fontweight="bold",
    )
    ax.set_ylabel("Actual")
    ax.set_xlabel("Predicted")
    fig.tight_layout()
    out_path = out_dir / f"{model_name}_confusion_matrix.png"
    fig.savefig(out_path, dpi=120)
    plt.close(fig)
    logger.info("Saved %s", out_path)
    return out_path


def plot_roc_curves(
    pipelines: dict,
    X_test: pd.DataFrame,
    y_test: pd.Series,
    out_dir: Path,
) -> Path:
    """Plot all ROC curves on a single figure."""
    fig, ax = plt.subplots(figsize=(7, 6))
    colors = {"logistic_regression": "#3B82F6", "random_forest": "#10B981", "xgboost": "#F59E0B"}

    for name, pipeline in pipelines.items():
        if hasattr(pipeline, "predict_proba"):
            y_prob = pipeline.predict_proba(X_test)[:, 1]
            RocCurveDisplay.from_predictions(
                y_test,
                y_prob,
                name=MODEL_DISPLAY_NAMES.get(name, name),
                ax=ax,
                color=colors.get(name, None),
            )

    ax.plot([0, 1], [0, 1], "k--", lw=1, label="Random Classifier")
    ax.set_title("ROC Curves — Model Comparison", fontsize=13, fontweight="bold")
    ax.set_xlabel("False Positive Rate")
    ax.set_ylabel("True Positive Rate")
    ax.legend(loc="lower right")
    fig.tight_layout()
    out_path = out_dir / "roc_curves_comparison.png"
    fig.savefig(out_path, dpi=120)
    plt.close(fig)
    logger.info("Saved %s", out_path)
    return out_path


def generate_all_eval_charts(
    metrics_dict: Dict[str, Dict[str, Any]],
    out_dir: Path,
) -> None:
    """Generate confusion matrix images from saved metrics."""
    eval_dir = out_dir / "evaluation"
    eval_dir.mkdir(parents=True, exist_ok=True)

    for model_name, metrics in metrics_dict.items():
        cm = metrics.get("confusion_matrix")
        if cm:
            plot_confusion_matrix(cm, model_name, eval_dir)
