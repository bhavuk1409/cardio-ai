"""
Core application configuration — reads from environment / .env file.
"""
from __future__ import annotations

import os
from pathlib import Path

os.environ["ANONYMIZED_TELEMETRY"] = "False"
os.environ["TOKENIZERS_PARALLELISM"] = "false"
from pydantic_settings import BaseSettings, SettingsConfigDict


BASE_DIR = Path(__file__).resolve().parents[3]   # clinical-risk-prediction/backend/


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=str(BASE_DIR / ".env"),
        env_file_encoding="utf-8",
        extra="ignore",
        protected_namespaces=("settings_",),
    )

    # API
    frontend_origin: str = "http://localhost:5173"
    api_host: str = "0.0.0.0"
    api_port: int = 8000

    # ML
    model_dir: Path = BASE_DIR / "models"
    results_dir: Path = BASE_DIR / "results"
    selected_model: str = "random_forest"
    random_seed: int = 42

    # RAG
    chroma_persist_dir: Path = BASE_DIR / "vectorstore"
    embedding_model: str = "all-MiniLM-L6-v2"
    top_k_retrieval: int = 5

    # LLM
    gemini_api_key: str = ""
    gemini_model: str = "gemini-1.5-flash"
    ollama_base_url: str = "http://localhost:11434"
    ollama_model: str = "llama3.2"

    @property
    def llm_available(self) -> bool:
        return bool(self.gemini_api_key and self.gemini_api_key != "your_gemini_api_key_here")


settings = Settings()
