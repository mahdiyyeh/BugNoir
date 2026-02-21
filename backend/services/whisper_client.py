"""
OpenAI Whisper API client for STT. Returns mock transcript on failure.
"""
import base64
import os
import logging
from typing import Optional

logger = logging.getLogger(__name__)

# TODO: Real WHISPER_API_KEY when credits available
WHISPER_API_KEY = os.getenv("WHISPER_API_KEY", "sk-FAKE-WHISPER-KEY-REPLACE-ME-00000004")


def transcribe(audio_base64: str) -> str:
    """
    Decode base64 audio, send to Whisper API, return transcript.
    On failure returns mock transcript so app never crashes.
    """
    if not audio_base64:
        return _mock_transcript()
    try:
        import openai
        client = openai.OpenAI(api_key=WHISPER_API_KEY)
        audio_bytes = base64.b64decode(audio_base64)
        # Whisper API expects file-like; use bytes
        from io import BytesIO
        buf = BytesIO(audio_bytes)
        buf.name = "audio.webm"
        resp = client.audio.transcriptions.create(model="whisper-1", file=buf)
        if resp and getattr(resp, "text", None):
            return resp.text.strip()
    except Exception as e:
        logger.warning("Whisper transcription failed: %s", e)
    return _mock_transcript()


def _mock_transcript() -> str:
    """Fallback for demo when Whisper is unavailable."""
    return "How do I ask to split the bill?"
