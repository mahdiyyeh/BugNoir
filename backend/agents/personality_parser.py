"""
PersonalityParser agent: reads user_id, queries Pinecone, returns personality profile.
"""
import logging
from backend.models.schemas import PersonalityProfile
from backend.services import pinecone_client

logger = logging.getLogger(__name__)


def get_personality(user_id: str) -> PersonalityProfile:
    """
    Query Pinecone (or in-memory fallback) for user personality.
    Returns a PersonalityProfile for downstream agents.
    """
    raw = pinecone_client.fetch_personality(user_id)
    if not raw:
        return PersonalityProfile(user_id=user_id, summary="", preferences=[])
    summary = raw.get("summary", "") or ""
    prefs = raw.get("preferences") or []
    if isinstance(prefs, str):
        prefs = [prefs]
    return PersonalityProfile(
        user_id=user_id,
        summary=summary,
        preferences=list(prefs),
        raw=raw,
    )
