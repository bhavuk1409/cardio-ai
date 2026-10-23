"""
Additional unit tests for:
  - Model save & reload
  - Metric generation
  - SHAP explanation output
  - RAG chunk metadata and retrieval
  - Missing LLM API key handling and graceful fallback
"""
import joblib
import pandas as pd
import pytest
from pathlib import Path

from app.core.config import settings
from app.services.model_service import ModelService
from app.ml.dataset import (
    load_dataset, clean_dataset, binarize_target, stratified_split, FEATURE_NAMES
)
from app.ml.explainer import compute_local_explanation, compute_global_importance
from app.rag.ingestion import _chunk_text, _stable_id, build_vectorstore
from app.rag.knowledge_base import KNOWLEDGE_BASE
from app.rag.retrieval import RetrievalService
from app.rag.llm import LLMService, format_context

VALID_INPUT = {
    "age": 63, "sex": 1, "cp": 1, "trestbps": 145, "chol": 233,
    "fbs": 1, "restecg": 2, "thalach": 150, "exang": 0,
    "oldpeak": 2.3, "slope": 3, "ca": 0, "thal": 6,
}


class TestModelPersistenceAndInference:
    def test_model_pipelines_exist_and_load(self):
        model_dir = settings.model_dir
        for name in ["logistic_regression", "random_forest", "xgboost"]:
            path = model_dir / f"{name}_pipeline.joblib"
            assert path.exists(), f"Missing model pipeline artifact {path}"
            pipeline = joblib.load(path)
            assert hasattr(pipeline, "predict")

    def test_model_service_reload(self):
        svc = ModelService()
        ok = svc.load(settings.model_dir, settings.results_dir)
        assert ok is True
        assert svc.ready is True
        assert len(svc.list_models()) >= 3

        pred = svc.predict(VALID_INPUT, "random_forest")
        assert "predicted_class" in pred
        assert pred["predicted_class"] in (0, 1)
        assert 0.0 <= pred["probability_positive_class"] <= 1.0


class TestSHAPExplanation:
    def test_shap_local_explanation(self):
        svc = ModelService()
        svc.load(settings.model_dir, settings.results_dir)
        pipeline = svc.get_pipeline("random_forest")

        data_dir = settings.model_dir.parent / "data"
        df_raw = load_dataset(data_dir)
        df = clean_dataset(df_raw)
        X, y = binarize_target(df)
        X_train, _, y_train, _ = stratified_split(X, y, random_state=settings.random_seed)

        local_exp = compute_local_explanation(pipeline, X_train, VALID_INPUT)
        assert local_exp["status"] == "ok"
        assert len(local_exp["contributions"]) > 0
        assert "feature" in local_exp["contributions"][0]
        assert "shap_value" in local_exp["contributions"][0]
        assert local_exp["contributions"][0]["direction"] in ("positive", "negative")

    def test_shap_global_importance(self):
        svc = ModelService()
        svc.load(settings.model_dir, settings.results_dir)
        pipeline = svc.get_pipeline("random_forest")

        data_dir = settings.model_dir.parent / "data"
        df_raw = load_dataset(data_dir)
        df = clean_dataset(df_raw)
        X, y = binarize_target(df)
        X_train, _, y_train, _ = stratified_split(X, y, random_state=settings.random_seed)

        global_imp = compute_global_importance(pipeline, X_train)
        assert global_imp["status"] == "ok"
        assert len(global_imp["top_features"]) > 0
        assert "importance" in global_imp["top_features"][0]


class TestRAGPipeline:
    def test_chunking_logic(self):
        sample_text = "This is a test of the chunking mechanism. " * 20
        chunks = _chunk_text(sample_text, chunk_size=100, overlap=20)
        assert len(chunks) > 1
        for ch in chunks:
            assert len(ch) <= 100

    def test_stable_id_deterministic(self):
        id1 = _stable_id("https://example.com/source1", "Overview", 0)
        id2 = _stable_id("https://example.com/source1", "Overview", 0)
        id3 = _stable_id("https://example.com/source1", "Overview", 1)
        assert id1 == id2
        assert id1 != id3

    def test_retrieval_and_metadata_preservation(self):
        from app.rag.retrieval import retrieval_service
        if not retrieval_service.ready:
            retrieval_service.load(settings.chroma_persist_dir)
        assert retrieval_service.ready is True

        passages = retrieval_service.retrieve("What is hypertension and high blood pressure?", top_k=3)
        assert len(passages) > 0
        p = passages[0]
        assert "text" in p
        assert "title" in p
        assert "url" in p
        assert "organization" in p
        assert "similarity_score" in p
        assert p["url"].startswith("http")

    def test_retrieval_evaluation_suite(self):
        from app.rag.retrieval import retrieval_service
        if not retrieval_service.ready:
            retrieval_service.load(settings.chroma_persist_dir)
        test_queries = [
            {
                "query": "What are heart disease risk factors?",
                "relevant_urls": [
                    "https://www.who.int/news-room/fact-sheets/detail/cardiovascular-diseases-(cvds)",
                    "https://www.cdc.gov/heart-disease/risk-factors/index.html"
                ]
            }
        ]
        eval_res = retrieval_service.evaluate_retrieval(test_queries)
        assert len(eval_res) == 1
        assert eval_res[0]["retrieved_count"] > 0
        assert eval_res[0]["precision_at_k"] >= 0.0


class TestLLMGracefulFallback:
    def test_missing_api_key_returns_educational_notice(self):
        llm = LLMService()
        # If API key is not configured or default, should handle gracefully
        res = llm.generate("What is coronary heart disease?", [])
        assert "sources_used" in res
        if not llm.ready:
            assert res["answer"] is None
            assert res["error"] is not None
            assert "LLM not configured" in res["error"]

    def test_format_context_empty(self):
        ctx = format_context([])
        assert "No relevant passages" in ctx

    def test_format_context_with_passages(self):
        passages = [{
            "title": "AHA Guidelines",
            "organization": "AHA",
            "url": "https://heart.org",
            "text": "Cardiovascular prevention guidelines."
        }]
        ctx = format_context(passages)
        assert "AHA Guidelines" in ctx
        assert "https://heart.org" in ctx
