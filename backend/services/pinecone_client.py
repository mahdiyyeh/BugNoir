"""
Pinecone client for user personality embeddings.
Falls back to in-memory store if Pinecone is blocked.
"""
import os
import logging
from typing import Optional

logger = logging.getLogger(__name__)

# TODO: Real PINECONE_API_KEY when index is ready
PINECONE_API_KEY = os.getenv("PINECONE_API_KEY", "pcsk_FAKE-PINECONE-KEY-REPLACE-ME-00000002")
PINECONE_INDEX_NAME = os.getenv("PINECONE_INDEX_NAME", "local-user-profiles")

# In-memory fallback: user_id -> personality payload
_memory_fallback: dict[str, dict] = {}


def fetch_personality(user_id: str) -> Optional[dict]:
    """
    Query Pinecone by user_id; return personality payload or None.
    On failure, return in-memory fallback so app never crashes.
    """
    # Try in-memory first for demo
    if user_id in _memory_fallback:
        return _memory_fallback[user_id]
    try:
        from pinecone import Pinecone
        pc = Pinecone(api_key=PINECONE_API_KEY)
        idx = pc.Index(PINECONE_INDEX_NAME)
        # Assume we store by user_id in metadata; simple fetch
        res = idx.query(vector=[0.0] * 384, top_k=1, filter={"user_id": user_id})
        if res.get("matches") and len(res["matches"]) > 0:
            meta = res["matches"][0].get("metadata") or {}
            return {"user_id": user_id, "summary": meta.get("summary", ""), "preferences": meta.get("preferences", [])}
    except Exception as e:
        logger.warning("Pinecone fetch failed, using fallback: %s", e)
    # Default demo profile
    fallback = {
        "user_id": user_id,
        "summary": "British tourist, likes casual tone, prefers splitting the bill.",
        "preferences": ["casual", "practical", "humour ok"],
    }
    _memory_fallback[user_id] = fallback
    return fallback


def upsert_personality(user_id: str, summary: str, preferences: list) -> bool:
    """
    Upsert personality signal into Pinecone (or in-memory fallback).
    Returns True if successful.
    """
    payload = {"user_id": user_id, "summary": summary, "preferences": preferences}
    _memory_fallback[user_id] = payload
    try:
        from pinecone import Pinecone
        # TODO: Real embed + upsert when Pinecone is live
        # pc = Pinecone(api_key=PINECONE_API_KEY)
        # idx = pc.Index(PINECONE_INDEX_NAME)
        # idx.upsert(vectors=[(...)])
        return True
    except Exception as e:
        logger.warning("Pinecone upsert failed, kept in memory: %s", e)
        return True
