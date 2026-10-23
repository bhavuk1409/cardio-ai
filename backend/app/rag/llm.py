"""
LLM integration with Google Gemini (primary) or Ollama (optional fallback).

The LLM is instructed to:
  1. Use retrieved passages as its evidence base.
  2. Cite sources next to factual claims.
  3. Distinguish source-supported facts from general explanations.
  4. State uncertainty and avoid unsupported diagnoses or prescriptions.
  5. Never alter the ML model's prediction or probability.
  6. State when context is insufficient.
"""
from __future__ import annotations

import logging
from typing import List, Dict, Any, Optional

from app.core.config import settings

logger = logging.getLogger(__name__)

SYSTEM_PROMPT = """You are a cardiovascular health information assistant for an educational prototype.
Your role is to help users understand cardiovascular health topics using the retrieved evidence passages provided below.

IMPORTANT RULES:
1. Base factual claims on the retrieved passages. Cite the source title/organization when using specific facts.
2. Distinguish between source-supported facts and your general explanatory wording.
3. Do NOT provide personalized medical advice, diagnoses, or treatment recommendations.
4. Do NOT alter, override, or reinterpret any machine learning model predictions or probabilities shown to the user.
5. If the retrieved context is insufficient to answer a question, say so explicitly.
6. Do NOT fabricate citations, URLs, statistics, or medical facts.
7. Recommend professional medical consultation for personal health concerns.
8. If a user mentions an emergency or urgent symptoms, advise them to call emergency services immediately.
9. This is an educational tool, not a clinical decision system.
10. Keep responses concise, clear, and accessible to a general audience.
"""


def format_context(passages: List[Dict]) -> str:
    """Format retrieved passages into a context block for the LLM."""
    if not passages:
        return "No relevant passages were retrieved from the knowledge base."

    lines = ["RETRIEVED EVIDENCE:\n"]
    for i, p in enumerate(passages, 1):
        lines.append(
            f"[{i}] Source: {p['title']} | {p['organization']}\n"
            f"    URL: {p['url']}\n"
            f"    Text: {p['text']}\n"
        )
    return "\n".join(lines)


class LLMService:
    """Wraps Gemini (primary) and Ollama (fallback) for grounded generation."""

    def __init__(self):
        self._ready = settings.llm_available
        self._provider = "gemini" if self._ready else "none"

    @property
    def ready(self) -> bool:
        return self._ready

    def generate(
        self,
        query: str,
        passages: List[Dict],
        conversation_history: Optional[List[Dict]] = None,
    ) -> Dict[str, Any]:
        """
        Generate a grounded response.

        Returns:
            {
                "answer": str,
                "provider": str,
                "sources_used": [str],
                "error": str | None,
            }
        """
        if not self._ready:
            return {
                "answer": None,
                "provider": "none",
                "sources_used": [],
                "error": (
                    "LLM not configured. Set GEMINI_API_KEY in your .env file. "
                    "Retrieved passages are shown below — you can read them directly."
                ),
            }

        context = format_context(passages)
        sources_used = list({p["url"] for p in passages})

        full_prompt = (
            f"{context}\n\n"
            f"USER QUESTION: {query}\n\n"
            "Please answer using the retrieved evidence above. "
            "Cite source names when making specific factual claims."
        )

        # Try Gemini
        try:
            return self._call_gemini(full_prompt, sources_used)
        except Exception as exc:
            logger.error("Gemini call failed: %s", exc)

        # Try Ollama fallback
        try:
            return self._call_ollama(full_prompt, sources_used)
        except Exception as exc2:
            logger.error("Ollama fallback failed: %s", exc2)
            return {
                "answer": None,
                "provider": "error",
                "sources_used": sources_used,
                "error": f"LLM generation failed: {exc2}",
            }

    def _call_gemini(self, prompt: str, sources_used: List[str]) -> Dict[str, Any]:
        import google.generativeai as genai

        genai.configure(api_key=settings.gemini_api_key)
        model = genai.GenerativeModel(
            model_name=settings.gemini_model,
            system_instruction=SYSTEM_PROMPT,
        )
        response = model.generate_content(
            prompt,
            generation_config=genai.GenerationConfig(
                max_output_tokens=1024,
                temperature=0.3,
            ),
            request_options={"timeout": 30},
        )
        answer = response.text.strip()
        logger.info("Gemini response received (%d chars).", len(answer))
        return {
            "answer": answer,
            "provider": f"gemini/{settings.gemini_model}",
            "sources_used": sources_used,
            "error": None,
        }

    def _call_ollama(self, prompt: str, sources_used: List[str]) -> Dict[str, Any]:
        import httpx

        payload = {
            "model": settings.ollama_model,
            "prompt": f"{SYSTEM_PROMPT}\n\n{prompt}",
            "stream": False,
        }
        resp = httpx.post(
            f"{settings.ollama_base_url}/api/generate",
            json=payload,
            timeout=60,
        )
        resp.raise_for_status()
        data = resp.json()
        answer = data.get("response", "").strip()
        logger.info("Ollama response received (%d chars).", len(answer))
        return {
            "answer": answer,
            "provider": f"ollama/{settings.ollama_model}",
            "sources_used": sources_used,
            "error": None,
        }


# Singleton
llm_service = LLMService()
