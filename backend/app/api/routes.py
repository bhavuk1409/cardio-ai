"""
API router — all routes prefixed /api/v1
"""
from __future__ import annotations

import logging
from typing import Optional

from fastapi import APIRouter, HTTPException, Query

from app.schemas.schemas import (
    ChatRequest,
    ChatResponse,
    ExplainRequest,
    ExplainResponse,
    HealthResponse,
    KnowledgeSource,
    KnowledgeSourcesResponse,
    MetricsResponse,
    ModelInfoResponse,
    PassageResult,
    PredictionInput,
    PredictionResponse,
    RetrieveRequest,
    RetrieveResponse,
    ShapContribution,
)
from app.services.model_service import model_service
from app.rag.retrieval import retrieval_service
from app.rag.llm import llm_service
from app.rag.knowledge_base import KNOWLEDGE_BASE
from app.core.config import settings

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/v1")


# ──────────────────────────────────────────────
# Health
# ──────────────────────────────────────────────

@router.get("/health", response_model=HealthResponse, tags=["System"])
async def health():
    return HealthResponse(
        status="ok",
        model_ready=model_service.ready,
        retrieval_ready=retrieval_service.ready,
        llm_ready=llm_service.ready,
    )


# ──────────────────────────────────────────────
# Model info & metrics
# ──────────────────────────────────────────────

@router.get("/model/info", response_model=ModelInfoResponse, tags=["Model"])
async def model_info():
    if not model_service.ready:
        return ModelInfoResponse(
            selected_model=settings.selected_model,
            available_models=[],
            model_version="unavailable",
            ready=False,
            error=model_service.error,
        )
    metrics = model_service.get_metrics()
    return ModelInfoResponse(
        selected_model=model_service.selected_model_name,
        available_models=model_service.list_models(),
        model_version=metrics.get("model_version", "1.0.0"),
        ready=True,
        training_date=metrics.get("training_date"),
        dataset=metrics.get("dataset"),
    )


@router.get("/model/metrics", response_model=MetricsResponse, tags=["Model"])
async def model_metrics():
    return MetricsResponse(models=model_service.get_all_metrics())


# ──────────────────────────────────────────────
# Prediction
# ──────────────────────────────────────────────

@router.post("/predict", response_model=PredictionResponse, tags=["Prediction"])
async def predict(body: PredictionInput):
    if not model_service.ready:
        raise HTTPException(
            status_code=503,
            detail=model_service.error or "Models not loaded. Run training first.",
        )
    try:
        result = model_service.predict(body.model_dump())
        cls = result["predicted_class"]
        prob = result.get("probability_positive_class")

        if cls == 0:
            interpretation = (
                "The model predicts class 0 (no disease detected in the dataset label). "
                f"Estimated probability of the positive class: {prob:.1%}."
                if prob is not None else
                "The model predicts class 0 (no disease detected in the dataset label)."
            )
        else:
            interpretation = (
                "The model predicts class 1 (disease present in the dataset label). "
                f"Estimated probability of the positive class: {prob:.1%}."
                if prob is not None else
                "The model predicts class 1 (disease present in the dataset label)."
            )

        return PredictionResponse(
            predicted_class=cls,
            probability_positive_class=prob,
            model_name=result["model_name"],
            model_version=result["model_version"],
            interpretation=interpretation,
        )
    except Exception as exc:
        logger.error("Prediction error: %s", exc, exc_info=True)
        raise HTTPException(status_code=500, detail=str(exc))


# ──────────────────────────────────────────────
# SHAP Explanation
# ──────────────────────────────────────────────

@router.post("/explain", response_model=ExplainResponse, tags=["Explainability"])
async def explain(body: ExplainRequest):
    if not model_service.ready:
        raise HTTPException(503, detail="Models not loaded.")

    from app.ml.explainer import compute_local_explanation, compute_global_importance
    from app.ml.dataset import load_dataset, clean_dataset, binarize_target, stratified_split
    from app.core.config import settings
    import pandas as pd

    try:
        model_name = body.model_name or model_service.selected_model_name
        pipeline = model_service.get_pipeline(model_name)

        # Load training data for explainer background
        data_dir = settings.model_dir.parent / "data"
        df_raw = load_dataset(data_dir)
        df = clean_dataset(df_raw)
        X, y = binarize_target(df)
        X_train, _, y_train, _ = stratified_split(X, y, random_state=settings.random_seed)

        input_dict = body.input_data.model_dump()
        local = compute_local_explanation(pipeline, X_train, input_dict)

        contributions = []
        if local["status"] == "ok":
            for c in local.get("contributions", []):
                contributions.append(ShapContribution(**c))

        # Global importance
        global_imp = compute_global_importance(pipeline, X_train)
        global_top = global_imp.get("top_features", []) if global_imp["status"] == "ok" else []

        return ExplainResponse(
            status=local["status"],
            contributions=contributions,
            base_value=local.get("base_value"),
            message=local.get("message"),
            global_importance=global_top,
        )

    except Exception as exc:
        logger.error("Explain error: %s", exc, exc_info=True)
        return ExplainResponse(status="error", message=str(exc))


# ──────────────────────────────────────────────
# RAG Retrieval
# ──────────────────────────────────────────────

@router.post("/rag/retrieve", response_model=RetrieveResponse, tags=["RAG"])
async def rag_retrieve(body: RetrieveRequest):
    if not retrieval_service.ready:
        raise HTTPException(
            503,
            detail=retrieval_service.error or "Vector store not ready.",
        )
    passages = retrieval_service.retrieve(body.query, body.top_k)
    return RetrieveResponse(
        query=body.query,
        passages=[PassageResult(**p) for p in passages],
        n_retrieved=len(passages),
    )


# ──────────────────────────────────────────────
# Chat
# ──────────────────────────────────────────────

@router.post("/chat", response_model=ChatResponse, tags=["Chat"])
async def chat(body: ChatRequest):
    passages = []
    retrieval_available = retrieval_service.ready

    if retrieval_available:
        try:
            passages = retrieval_service.retrieve(body.query, body.top_k)
        except Exception as exc:
            logger.error("Retrieval error in chat: %s", exc)
            retrieval_available = False

    llm_available = llm_service.ready
    llm_result = llm_service.generate(body.query, passages)

    return ChatResponse(
        query=body.query,
        answer=llm_result.get("answer"),
        passages=[PassageResult(**p) for p in passages],
        sources_used=llm_result.get("sources_used", []),
        provider=llm_result.get("provider", "none"),
        retrieval_available=retrieval_available,
        llm_available=llm_available,
        error=llm_result.get("error"),
    )


# ──────────────────────────────────────────────
# Knowledge sources
# ──────────────────────────────────────────────

@router.get("/knowledge/sources", response_model=KnowledgeSourcesResponse, tags=["Knowledge"])
async def knowledge_sources():
    sources = []
    seen = set()
    for doc in KNOWLEDGE_BASE:
        key = doc["url"]
        if key not in seen:
            seen.add(key)
            sources.append(KnowledgeSource(
                title=doc["title"],
                organization=doc["organization"],
                url=doc["url"],
                section=doc.get("section", ""),
                retrieved_date=doc.get("retrieved_date", ""),
            ))
    return KnowledgeSourcesResponse(sources=sources, total=len(sources))
