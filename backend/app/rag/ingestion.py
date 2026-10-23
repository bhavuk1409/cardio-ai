"""
Document ingestion pipeline:
  1. Load documents from KNOWLEDGE_BASE manifest.
  2. Split into overlapping chunks.
  3. Embed with sentence-transformers (all-MiniLM-L6-v2).
  4. Store in ChromaDB with stable IDs and metadata.
"""
from __future__ import annotations

import hashlib
import logging
from pathlib import Path
from typing import List, Dict

from app.rag.knowledge_base import KNOWLEDGE_BASE
from app.core.config import settings

logger = logging.getLogger(__name__)

CHUNK_SIZE = 400     # characters
CHUNK_OVERLAP = 80  # characters


def _chunk_text(text: str, chunk_size: int = CHUNK_SIZE, overlap: int = CHUNK_OVERLAP) -> List[str]:
    """Split text into overlapping character-level chunks."""
    chunks = []
    start = 0
    while start < len(text):
        end = min(start + chunk_size, len(text))
        chunks.append(text[start:end])
        if end == len(text):
            break
        start = end - overlap
    return chunks


def _stable_id(url: str, section: str, chunk_idx: int) -> str:
    """Generate a unique stable ID per URL+section+chunk combination."""
    key = f"{url}::{section}::chunk::{chunk_idx}"
    return hashlib.sha256(key.encode()).hexdigest()[:32]


def build_vectorstore(persist_dir: Path | None = None) -> "chromadb.Collection":
    """
    Ingest all documents into ChromaDB.
    Returns the collection.
    """
    import chromadb
    from chromadb.utils import embedding_functions

    persist_dir = persist_dir or settings.chroma_persist_dir
    persist_dir.mkdir(parents=True, exist_ok=True)

    emb_fn = embedding_functions.SentenceTransformerEmbeddingFunction(
        model_name=settings.embedding_model
    )

    client = chromadb.PersistentClient(path=str(persist_dir))

    # Delete existing collection to allow rebuild
    try:
        client.delete_collection("cardiovascular_kb")
        logger.info("Deleted existing collection for rebuild.")
    except Exception:
        pass

    collection = client.create_collection(
        name="cardiovascular_kb",
        embedding_function=emb_fn,
        metadata={"hnsw:space": "cosine"},
    )

    all_docs, all_ids, all_metas = [], [], []

    for doc in KNOWLEDGE_BASE:
        chunks = _chunk_text(doc["text"])
        for idx, chunk in enumerate(chunks):
            chunk_id = _stable_id(doc["url"], doc.get("section", ""), idx)
            all_ids.append(chunk_id)
            all_docs.append(chunk)
            all_metas.append({
                "title": doc["title"],
                "organization": doc["organization"],
                "url": doc["url"],
                "section": doc.get("section", ""),
                "retrieved_date": doc.get("retrieved_date", ""),
                "chunk_index": idx,
                "total_chunks": len(chunks),
            })

    # Batch upsert
    BATCH = 64
    for i in range(0, len(all_ids), BATCH):
        collection.add(
            ids=all_ids[i:i+BATCH],
            documents=all_docs[i:i+BATCH],
            metadatas=all_metas[i:i+BATCH],
        )

    logger.info(
        "Ingested %d chunks from %d documents into ChromaDB at %s",
        len(all_ids),
        len(KNOWLEDGE_BASE),
        persist_dir,
    )
    return collection


def get_collection(persist_dir: Path | None = None):
    """Load the existing ChromaDB collection."""
    import chromadb
    from chromadb.utils import embedding_functions

    persist_dir = persist_dir or settings.chroma_persist_dir

    emb_fn = embedding_functions.SentenceTransformerEmbeddingFunction(
        model_name=settings.embedding_model
    )

    client = chromadb.PersistentClient(path=str(persist_dir))
    return client.get_collection(
        name="cardiovascular_kb",
        embedding_function=emb_fn,
    )
