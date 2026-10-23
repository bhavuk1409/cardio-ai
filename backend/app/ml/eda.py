"""
EDA — generate visualizations and summary statistics.
Charts are saved to results/eda/.
"""
from __future__ import annotations

import logging
from pathlib import Path

import matplotlib
matplotlib.use("Agg")  # non-interactive backend
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
import seaborn as sns

from app.ml.dataset import FEATURE_NAMES, NUMERIC_FEATURES, CATEGORICAL_FEATURES

logger = logging.getLogger(__name__)

sns.set_theme(style="whitegrid", palette="muted")
FIGSIZE = (10, 6)


def run_eda(df: pd.DataFrame, y: pd.Series, out_dir: Path) -> dict:
    """
    Generate all EDA charts and return a summary dict.

    Parameters
    ----------
    df : pd.DataFrame  — feature dataframe (cleaned, pre-split)
    y  : pd.Series     — binary target
    out_dir : Path     — directory to save PNG files
    """
    out_dir.mkdir(parents=True, exist_ok=True)
    summary = {}

    # ── 1. Target distribution ─────────────────────────────────────────
    fig, ax = plt.subplots(figsize=(7, 5))
    counts = y.value_counts().sort_index()
    bars = ax.bar(
        ["Class 0\n(No Disease)", "Class 1\n(Disease Present)"],
        counts.values,
        color=["#3B82F6", "#EF4444"],
        edgecolor="white",
        width=0.5,
    )
    for bar, cnt in zip(bars, counts.values):
        ax.text(
            bar.get_x() + bar.get_width() / 2,
            bar.get_height() + 2,
            str(cnt),
            ha="center",
            va="bottom",
            fontweight="bold",
        )
    ax.set_title("Target Class Distribution", fontsize=14, fontweight="bold")
    ax.set_ylabel("Number of Records")
    ax.set_ylim(0, max(counts.values) * 1.15)
    fig.tight_layout()
    fig.savefig(out_dir / "target_distribution.png", dpi=120)
    plt.close(fig)
    summary["target_distribution"] = counts.to_dict()
    logger.info("Saved target_distribution.png")

    # ── 2. Missing values ──────────────────────────────────────────────
    missing = df[FEATURE_NAMES].isna().sum()
    missing_pct = (missing / len(df) * 100).round(1)
    fig, ax = plt.subplots(figsize=FIGSIZE)
    colors = ["#EF4444" if v > 0 else "#93C5FD" for v in missing.values]
    ax.barh(FEATURE_NAMES, missing.values, color=colors, edgecolor="white")
    for i, (cnt, pct) in enumerate(zip(missing.values, missing_pct.values)):
        ax.text(cnt + 0.1, i, f"{cnt} ({pct}%)", va="center", fontsize=9)
    ax.set_title("Missing Values by Feature", fontsize=14, fontweight="bold")
    ax.set_xlabel("Number of Missing Values")
    fig.tight_layout()
    fig.savefig(out_dir / "missing_values.png", dpi=120)
    plt.close(fig)
    summary["missing_values"] = missing.to_dict()
    logger.info("Saved missing_values.png")

    # ── 3. Numeric feature distributions ──────────────────────────────
    n = len(NUMERIC_FEATURES)
    fig, axes = plt.subplots(1, n, figsize=(4 * n, 5))
    for ax, feat in zip(axes, NUMERIC_FEATURES):
        df_feat = df[feat].dropna()
        ax.hist(df_feat, bins=20, color="#3B82F6", edgecolor="white", alpha=0.8)
        ax.set_title(feat, fontsize=11)
        ax.set_xlabel("Value")
        ax.set_ylabel("Count" if feat == NUMERIC_FEATURES[0] else "")
    fig.suptitle("Numeric Feature Distributions", fontsize=14, fontweight="bold", y=1.02)
    fig.tight_layout()
    fig.savefig(out_dir / "numeric_distributions.png", dpi=120, bbox_inches="tight")
    plt.close(fig)
    logger.info("Saved numeric_distributions.png")

    # ── 4. Correlation heatmap (numeric features + target) ─────────────
    df_corr = df[NUMERIC_FEATURES].copy()
    df_corr["target"] = y.values
    corr = df_corr.corr()
    fig, ax = plt.subplots(figsize=(8, 7))
    mask = np.triu(np.ones_like(corr, dtype=bool), k=1)
    sns.heatmap(
        corr,
        annot=True,
        fmt=".2f",
        cmap="RdBu_r",
        center=0,
        ax=ax,
        square=True,
        linewidths=0.5,
        cbar_kws={"shrink": 0.8},
    )
    ax.set_title("Correlation Matrix (Numeric Features + Target)", fontsize=13, fontweight="bold")
    fig.tight_layout()
    fig.savefig(out_dir / "correlation_heatmap.png", dpi=120)
    plt.close(fig)
    logger.info("Saved correlation_heatmap.png")

    # ── 5. Age distribution by target ──────────────────────────────────
    fig, ax = plt.subplots(figsize=(9, 5))
    for cls, label, color in [(0, "No Disease (0)", "#3B82F6"), (1, "Disease (1)", "#EF4444")]:
        subset = df.loc[y == cls, "age"].dropna()
        ax.hist(subset, bins=15, alpha=0.6, label=label, color=color, edgecolor="white")
    ax.set_title("Age Distribution by Target Class", fontsize=13, fontweight="bold")
    ax.set_xlabel("Age (years)")
    ax.set_ylabel("Count")
    ax.legend()
    fig.tight_layout()
    fig.savefig(out_dir / "age_by_target.png", dpi=120)
    plt.close(fig)
    logger.info("Saved age_by_target.png")

    # ── 6. Max heart rate by target ────────────────────────────────────
    fig, ax = plt.subplots(figsize=(8, 5))
    data_0 = df.loc[y == 0, "thalach"].dropna()
    data_1 = df.loc[y == 1, "thalach"].dropna()
    ax.boxplot(
        [data_0, data_1],
        labels=["No Disease (0)", "Disease (1)"],
        patch_artist=True,
        boxprops=dict(facecolor="#BFDBFE"),
        medianprops=dict(color="#1E40AF", linewidth=2),
    )
    ax.set_title("Max Heart Rate (thalach) by Target Class", fontsize=13, fontweight="bold")
    ax.set_ylabel("Max Heart Rate (bpm)")
    fig.tight_layout()
    fig.savefig(out_dir / "thalach_by_target.png", dpi=120)
    plt.close(fig)
    logger.info("Saved thalach_by_target.png")

    # ── 7. Chest pain type by target ───────────────────────────────────
    cp_labels = {1: "Typical\nAngina", 2: "Atypical\nAngina", 3: "Non-Anginal", 4: "Asymptomatic"}
    df_cp = pd.DataFrame({"cp": df["cp"], "target": y})
    cp_counts = df_cp.groupby(["cp", "target"]).size().unstack(fill_value=0)
    fig, ax = plt.subplots(figsize=(9, 5))
    x = np.arange(len(cp_counts))
    width = 0.35
    bars0 = ax.bar(x - width / 2, cp_counts.get(0, 0), width, label="No Disease", color="#3B82F6")
    bars1 = ax.bar(x + width / 2, cp_counts.get(1, 0), width, label="Disease", color="#EF4444")
    ax.set_xticks(x)
    ax.set_xticklabels([cp_labels.get(i, str(i)) for i in cp_counts.index])
    ax.set_title("Chest Pain Type by Target Class", fontsize=13, fontweight="bold")
    ax.set_ylabel("Count")
    ax.legend()
    fig.tight_layout()
    fig.savefig(out_dir / "chest_pain_by_target.png", dpi=120)
    plt.close(fig)
    logger.info("Saved chest_pain_by_target.png")

    return summary
