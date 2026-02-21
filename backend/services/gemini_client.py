"""
Gemini LLM client. All calls wrapped in try/except with mock fallback.
"""
import os
import logging
from typing import Optional

logger = logging.getLogger(__name__)

# TODO: Real GEMINI_API_KEY when credits loaded
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "AIzaSy-FAKE-GEMINI-KEY-REPLACE-ME-00000001")
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-1.5-pro")

_model = None


def get_model():
    """Return configured GenerativeModel; safe to call without key (returns None)."""
    global _model
    if _model is not None:
        return _model
    try:
        import google.generativeai as genai
        genai.configure(api_key=GEMINI_API_KEY)
        _model = genai.GenerativeModel(GEMINI_MODEL)
        return _model
    except Exception as e:
        logger.warning("Gemini not configured: %s", e)
        return None


def generate(prompt: str, system_instruction: Optional[str] = None) -> str:
    """
    Call Gemini with prompt (and optional system instruction).
    Returns mock response on failure so app never crashes.
    """
    model = get_model()
    if model is None:
        return _mock_generate(prompt)
    try:
        kwargs = {}
        if system_instruction:
            kwargs["system_instruction"] = system_instruction
        response = model.generate_content(prompt, **kwargs)
        if response and response.text:
            return response.text.strip()
        return _mock_generate(prompt)
    except Exception as e:
        logger.warning("Gemini call failed: %s", e)
        return _mock_generate(prompt)


def _mock_generate(prompt: str) -> str:
    """Fallback when Gemini is unavailable."""
    return (
        "Mock response: I'd say something like « L’addition, s’il vous plaît » for the full bill, "
        "or « On peut payer séparément ? » to ask to split. In a brasserie it’s very normal. "
        "[Gemini unavailable — using fallback]"
    )
