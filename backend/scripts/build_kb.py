#!/usr/bin/env python3
"""
Build / rebuild the ChromaDB vector store from the curated knowledge base.

Run from backend/ directory:
    python -m scripts.build_kb
"""
from __future__ import annotations

import logging
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.core.config import settings
from app.core.logging import setup_logging
from app.rag.ingestion import build_vectorstore

setup_logging()
logger = logging.getLogger(__name__)


def main():
    logger.info("=== Knowledge Base Ingestion Start ===")
    collection = build_vectorstore(settings.chroma_persist_dir)
    count = collection.count()
    print(f"\n✓ Vector store built successfully.")
    print(f"  Total chunks: {count}")
    print(f"  Stored at:    {settings.chroma_persist_dir}\n")


if __name__ == "__main__":
    main()
