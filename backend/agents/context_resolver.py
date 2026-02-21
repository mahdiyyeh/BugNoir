"""
ContextResolver agent: takes GPS + location_type, RAGs paris_knowledge_base.json.
MVP: simple keyword match over JSON; no vector RAG unless we add it later.
"""
import json
import os
import logging
from pathlib import Path

from backend.models.schemas import ResolvedContext

logger = logging.getLogger(__name__)

_DATA: list[dict] = []


def _load_paris_kb() -> list[dict]:
    """Load Paris knowledge base from data/paris_knowledge_base.json."""
    global _DATA
    if _DATA:
        return _DATA
    base = Path(__file__).resolve().parent.parent
    path = base / "data" / "paris_knowledge_base.json"
    try:
        with open(path, "r", encoding="utf-8") as f:
            _DATA = json.load(f)
        return _DATA
    except Exception as e:
        logger.warning("Could not load paris_knowledge_base.json: %s", e)
        _DATA = []
        return _DATA


def resolve_context(latitude: float, longitude: float, location_type: str) -> ResolvedContext:
    """
    RAG over Paris knowledge base by location_type (and optionally GPS later).
    Returns snippets relevant to the location for ResponseGenerator.
    """
    kb = _load_paris_kb()
    snippets: list[str] = []
    location_lower = location_type.lower().strip()
    for entry in kb:
        types = entry.get("location_types") or entry.get("location_type") or []
        if isinstance(types, str):
            types = [types]
        if any(location_lower in (t or "").lower() for t in types):
            snippets.append(entry.get("content") or entry.get("snippet") or str(entry))
        # Also match by key
        if "brasserie" in location_lower and "brasserie" in str(entry).lower():
            content = entry.get("content") or entry.get("snippet")
            if content and content not in snippets:
                snippets.append(content)
    if not snippets:
        snippets = [
            "In Paris brasseries, splitting the bill is common. You can say « L'addition, s'il vous plaît » for the bill, "
            "or « On peut payer séparément ? » to ask to split. Tipping is included (service compris); rounding up is polite."
        ]
    return ResolvedContext(location_type=location_type, snippets=snippets[:5], raw=None)
