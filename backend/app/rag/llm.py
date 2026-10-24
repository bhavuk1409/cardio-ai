"""
LLM integration with Groq (primary) or Ollama (optional fallback).

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
1. Base factual medical claims on the retrieved passages. Cite the source title/organization when using specific facts.
2. Distinguish between source-supported facts and your general explanatory wording.
3. Do NOT provide personalized medical advice, diagnoses, or treatment recommendations.
4. Do NOT alter, override, or reinterpret any machine learning model predictions or probabilities shown to the user.
5. If the retrieved context is insufficient to answer a factual clinical question, say so explicitly.
6. Maintain conversational continuity across turns. You remember earlier questions, patient details, and dialogue context shared in this conversation.
7. Do NOT fabricate citations, URLs, statistics, or medical facts.
8. Recommend professional medical consultation for personal health concerns.
9. If a user mentions an emergency or urgent symptoms, advise them to call emergency services immediately.
10. This is an educational tool, not a clinical decision system.
11. Keep responses concise, clear, and accessible to a general audience.
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
    """Wraps Groq (primary) and Ollama (fallback) for grounded generation."""

    def __init__(self):
        self._ready = settings.llm_available
        self._provider = "groq" if self._ready else "none"

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
                    "LLM not configured. Set GROQ_API_KEY in your .env file. "
                    "Retrieved passages are shown below — you can read them directly."
                ),
            }

        context = format_context(passages)
        sources_used = list({p["url"] for p in passages})

        current_prompt = (
            f"{context}\n\n"
            f"USER QUESTION: {query}\n\n"
            "Please answer the user's question. For clinical claims, base them on the retrieved evidence above and cite sources. "
            "Use previous turns in the dialogue to resolve follow-ups, references, and ongoing patient context."
        )

        # Assemble conversation messages with system prompt & memory
        chat_messages = [{"role": "system", "content": SYSTEM_PROMPT}]

        # Append previous conversation turns for conversational memory (up to last 10 messages)
        if conversation_history:
            for turn in conversation_history[-10:]:
                role = turn.get("role")
                content = turn.get("content")
                if role in ("user", "assistant") and content:
                    chat_messages.append({"role": role, "content": content})

        # Append current user prompt with context
        chat_messages.append({"role": "user", "content": current_prompt})

        # Try Groq
        try:
            return self._call_groq(chat_messages, sources_used)
        except Exception as exc:
            logger.error("Groq call failed: %s", exc)

        # Try Ollama fallback
        try:
            return self._call_ollama(chat_messages, sources_used)
        except Exception as exc2:
            logger.error("Ollama fallback failed: %s", exc2)
            return {
                "answer": None,
                "provider": "error",
                "sources_used": sources_used,
                "error": f"LLM generation failed: {exc2}",
            }

    def _call_groq(self, messages: List[Dict], sources_used: List[str]) -> Dict[str, Any]:
        from groq import Groq

        client = Groq(api_key=settings.groq_api_key)
        chat_completion = client.chat.completions.create(
            messages=messages,
            model=settings.groq_model,
            temperature=0.2,
            max_tokens=1024,
        )
        answer = chat_completion.choices[0].message.content.strip()
        logger.info("Groq response received (%d chars).", len(answer))
        return {
            "answer": answer,
            "provider": f"groq/{settings.groq_model}",
            "sources_used": sources_used,
            "error": None,
        }

    def _call_ollama(self, messages: List[Dict], sources_used: List[str]) -> Dict[str, Any]:
        import httpx

        payload = {
            "model": settings.ollama_model,
            "messages": messages,
            "stream": False,
        }
        resp = httpx.post(
            f"{settings.ollama_base_url}/api/chat",
            json=payload,
            timeout=60,
        )
        resp.raise_for_status()
        data = resp.json()
        answer = data.get("message", {}).get("content", "").strip()
        logger.info("Ollama response received (%d chars).", len(answer))
        return {
            "answer": answer,
            "provider": f"ollama/{settings.ollama_model}",
            "sources_used": sources_used,
            "error": None,
        }


# Singleton
llm_service = LLMService()
