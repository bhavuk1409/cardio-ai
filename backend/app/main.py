"""
FastAPI application entry point.
"""
from __future__ import annotations

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.core.logging import setup_logging
from app.api.routes import router
from app.services.model_service import model_service
from app.rag.retrieval import retrieval_service

setup_logging()
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup: load models and vector store."""
    logger.info("=== Clinical Risk Prediction — Backend Starting ===")

    model_dir = settings.model_dir
    results_dir = settings.results_dir
    model_dir.mkdir(parents=True, exist_ok=True)
    results_dir.mkdir(parents=True, exist_ok=True)

    model_ok = model_service.load(model_dir, results_dir)
    if model_ok:
        logger.info("✓ Model service ready (selected: %s)", model_service.selected_model_name)
    else:
        logger.warning("✗ Model service not ready: %s", model_service.error)

    retrieval_ok = retrieval_service.load(settings.chroma_persist_dir)
    if retrieval_ok:
        logger.info("✓ Retrieval service ready")
    else:
        logger.warning("✗ Retrieval service not ready: %s", retrieval_service.error)

    if settings.llm_available:
        logger.info("✓ LLM configured (Groq: %s)", settings.groq_model)
    else:
        logger.info("ℹ LLM not configured — set GROQ_API_KEY to enable chat generation")

    logger.info("=== Startup complete ===")
    yield
    logger.info("=== Shutdown ===")


app = FastAPI(
    title="Clinical Risk Prediction API",
    description=(
        "AI-Driven Clinical Risk Prediction and Context-Aware Medical Information Retrieval. "
        "Educational prototype — not a clinically validated medical device."
    ),
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router)


@app.get("/")
async def root():
    return {
        "name": "Clinical Risk Prediction API",
        "version": "1.0.0",
        "docs": "/docs",
        "health": "/api/v1/health",
    }
