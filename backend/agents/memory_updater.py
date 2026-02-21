"""
MemoryUpdater agent: upserts new preference signal into Pinecone + logs to PostgreSQL.
"""
import logging
from backend.models.schemas import PersonalityProfile
from backend.services import pinecone_client
from backend.db.postgres import log_conversation

logger = logging.getLogger(__name__)


def update_memory(
    user_id: str,
    personality: PersonalityProfile,
    transcript: str,
    chosen_variant: str,
    response_preview: str,
    location_type: str = "brasserie",
) -> None:
    """
    Optionally derive a preference signal from chosen_variant and upsert to Pinecone.
    Always log the conversation to PostgreSQL when available.
    """
    # Infer preference: if they got casual and we recommended casual, reinforce
    new_prefs = list(personality.preferences or [])
    if chosen_variant and chosen_variant not in new_prefs:
        new_prefs.append(chosen_variant)
    summary = personality.summary or ""
    if transcript and len(summary) < 500:
        summary = (summary + " " + f"Last ask: {transcript[:200]}.").strip()
    pinecone_client.upsert_personality(user_id, summary[:1000], new_prefs[:20])
    log_conversation(user_id, location_type, transcript[:200], response_preview[:200])
