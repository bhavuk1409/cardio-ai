"""
Model loading service — loads trained pipelines from disk at startup.
"""
from __future__ import annotations

import json
import logging
from pathlib import Path
from typing import Dict, Optional

import joblib
import pandas as pd
from sklearn.pipeline import Pipeline

from app.core.config import settings

logger = logging.getLogger(__name__)

MODEL_NAMES = ["logistic_regression", "random_forest", "xgboost"]


class ModelService:
    """Singleton service that holds all loaded model pipelines and metrics."""

    def __init__(self):
        self._pipelines: Dict[str, Pipeline] = {}
        self._metrics: Dict[str, dict] = {}
        self._selected_model: str = settings.selected_model
        self._ready: bool = False
        self._error: Optional[str] = None

    def load(self, model_dir: Path, results_dir: Path) -> bool:
        """
        Attempt to load all model pipelines and their evaluation metrics.
        Returns True if at least the selected model is available.
        """
        loaded = []
        for name in MODEL_NAMES:
            pipeline_path = model_dir / f"{name}_pipeline.joblib"
            metrics_path = results_dir / f"{name}_metrics.json"

            if pipeline_path.exists():
                try:
                    self._pipelines[name] = joblib.load(pipeline_path)
                    logger.info("Loaded pipeline: %s", name)
                    loaded.append(name)
                except Exception as exc:
                    logger.error("Failed to load pipeline %s: %s", name, exc)

            if metrics_path.exists():
                try:
                    with open(metrics_path) as f:
                        self._metrics[name] = json.load(f)
                except Exception as exc:
                    logger.warning("Failed to load metrics for %s: %s", name, exc)

        if self._selected_model not in self._pipelines and loaded:
            self._selected_model = loaded[0]
            logger.warning(
                "Selected model '%s' not found. Falling back to '%s'.",
                settings.selected_model,
                self._selected_model,
            )

        self._ready = self._selected_model in self._pipelines
        if not self._ready:
            self._error = (
                "No trained models found. "
                "Run: python -m scripts.train_models from the backend directory."
            )
            logger.error(self._error)
        return self._ready

    @property
    def ready(self) -> bool:
        return self._ready

    @property
    def error(self) -> Optional[str]:
        return self._error

    @property
    def selected_model_name(self) -> str:
        return self._selected_model

    def get_pipeline(self, name: Optional[str] = None) -> Pipeline:
        name = name or self._selected_model
        if name not in self._pipelines:
            raise ValueError(f"Model '{name}' is not loaded.")
        return self._pipelines[name]

    def get_metrics(self, name: Optional[str] = None) -> dict:
        name = name or self._selected_model
        return self._metrics.get(name, {})

    def get_all_metrics(self) -> dict:
        return self._metrics

    def list_models(self) -> list:
        return list(self._pipelines.keys())

    def predict(self, input_dict: dict, model_name: Optional[str] = None) -> dict:
        """Run prediction and return class + probability."""
        pipeline = self.get_pipeline(model_name)
        from app.ml.dataset import FEATURE_NAMES

        X = pd.DataFrame([input_dict])[FEATURE_NAMES]
        pred_class = int(pipeline.predict(X)[0])
        prob = None
        if hasattr(pipeline, "predict_proba"):
            prob = float(pipeline.predict_proba(X)[0][1])

        return {
            "predicted_class": pred_class,
            "probability_positive_class": prob,
            "model_name": model_name or self._selected_model,
            "model_version": self._metrics.get(
                model_name or self._selected_model, {}
            ).get("model_version", "unknown"),
        }


# Module-level singleton — imported by FastAPI lifespan
model_service = ModelService()
