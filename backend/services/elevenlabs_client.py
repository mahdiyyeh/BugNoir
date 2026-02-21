"""
ElevenLabs TTS client. Returns None (no audio) on failure so app still returns text.
"""
import base64
import os
import logging
from typing import Optional

logger = logging.getLogger(__name__)

# TODO: Real ELEVENLABS_API_KEY when credits available
ELEVENLABS_API_KEY = os.getenv("ELEVENLABS_API_KEY", "sk_FAKE-ELEVENLABS-KEY-REPLACE-ME-00000003")
ELEVENLABS_VOICE_ID = os.getenv("ELEVENLABS_VOICE_ID", "ErXwobaYiN019PkySvjV")


def text_to_speech(text: str) -> Optional[str]:
    """
    Convert text to speech via ElevenLabs; return base64 audio or None.
    On failure returns None; caller can omit audio_url.
    """
    if not text:
        return None
    try:
        import requests
        url = f"https://api.elevenlabs.io/v1/text-to-speech/{ELEVENLABS_VOICE_ID}"
        headers = {
            "xi-api-key": ELEVENLABS_API_KEY,
            "Content-Type": "application/json",
        }
        data = {"text": text[:5000], "model_id": "eleven_multilingual_v2"}
        resp = requests.post(url, json=data, headers=headers, timeout=10)
        if resp.status_code == 200 and resp.content:
            return base64.b64encode(resp.content).decode("utf-8")
    except Exception as e:
        logger.warning("ElevenLabs TTS failed: %s", e)
    return None
