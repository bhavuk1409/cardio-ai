"""
RAG retrieval service — similarity search against the ChromaDB vector store.
"""
from __future__ import annotations

import logging
from typing import List, Dict, Any, Optional

from app.core.config import settings

logger = logging.getLogger(__name__)


class RetrievalService:
    """Handles embedding queries and fetching relevant passages."""

    def __init__(self):
        self._collection = None
        self._ready = False
        self._error: Optional[str] = None

    def load(self, persist_dir=None) -> bool:
        try:
            from app.rag.ingestion import get_collection
            self._collection = get_collection(persist_dir)
            count = self._collection.count()
            logger.info("ChromaDB collection loaded: %d chunks.", count)
            self._ready = count > 0
            if not self._ready:
                self._error = "Vector store is empty. Run: python -m scripts.build_kb"
        except Exception as exc:
            self._error = f"Vector store not found or corrupt: {exc}. Run: python -m scripts.build_kb"
            logger.error(self._error)
            self._ready = False
        return self._ready

    @property
    def ready(self) -> bool:
        return self._ready

    @property
    def error(self) -> Optional[str]:
        return self._error

    def retrieve(self, query: str, top_k: int | None = None) -> List[Dict[str, Any]]:
        """
        Retrieve top-k most relevant passages for the query.
        Returns a list of passage dicts with text, metadata and distance.
        """
        if not self._ready:
            raise RuntimeError(self._error or "Retrieval service not ready.")

        top_k = top_k or settings.top_k_retrieval
        results = self._collection.query(
            query_texts=[query],
            n_results=min(top_k, self._collection.count()),
            include=["documents", "metadatas", "distances"],
        )

        passages = []
        docs = results["documents"][0]
        metas = results["metadatas"][0]
        dists = results["distances"][0]

        seen_chunks = set()
        for doc, meta, dist in zip(docs, metas, dists):
            # Deduplicate by text
            key = doc[:100]
            if key in seen_chunks:
                continue
            seen_chunks.add(key)

            # Cosine distance → similarity score (1 - distance)
            similarity = round(1.0 - float(dist), 4)

            passages.append({
                "text": doc,
                "title": meta.get("title", ""),
                "organization": meta.get("organization", ""),
                "url": meta.get("url", ""),
                "section": meta.get("section", ""),
                "similarity_score": similarity,
                "chunk_index": meta.get("chunk_index", 0),
            })

        return passages

    def evaluate_retrieval(self, test_queries: List[Dict]) -> List[Dict]:
        """
        Simple retrieval evaluation over a set of labelled queries.
        Each entry in test_queries: {"query": str, "relevant_urls": [str]}
        Returns precision@k results.
        """
        results = []
        for item in test_queries:
            query = item["query"]
            relevant_urls = set(item.get("relevant_urls", []))
            passages = self.retrieve(query)
            retrieved_urls = {p["url"] for p in passages}
            hits = len(relevant_urls & retrieved_urls)
            precision_k = hits / max(len(passages), 1)
            recall_k = hits / max(len(relevant_urls), 1) if relevant_urls else None

            results.append({
                "query": query,
                "retrieved_count": len(passages),
                "precision_at_k": round(precision_k, 3),
                "recall_at_k": round(recall_k, 3) if recall_k is not None else "n/a",
                "top_sources": [p["title"] for p in passages[:3]],
            })
        return results


# Module-level singleton
retrieval_service = RetrievalService()
