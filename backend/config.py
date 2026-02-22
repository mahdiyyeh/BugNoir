"""
Local: Your Mutual Polyglot Friend — Backend configuration.
Loads settings from environment via pydantic-settings (e.g. from .env).
"""
from functools import lru_cache
from typing import Optional

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
        case_sensitive=False,
    )

    # Gemini API (REST / generateContent)
    gemini_api_key: Optional[str] = None

    # Live translation / Gemini Live API (WebSocket streaming)
    live_translation_api_key: Optional[str] = None

    # Prefer GOOGLE_API_KEY if set (e.g. for Vertex), else GEMINI_API_KEY
    def get_gemini_api_key(self) -> str:
        key = self.gemini_api_key
        if not key:
            raise ValueError(
                "GEMINI_API_KEY is not set. Add it to .env or set the environment variable."
            )
        return key

    def get_live_api_key(self) -> Optional[str]:
        """API key for Live/WebSocket translation. Falls back to Gemini key if not set."""
        return self.live_translation_api_key or self.gemini_api_key


@lru_cache
def get_settings() -> Settings:
    """Cached settings instance. Loads from .env in project root (when running uvicorn from repo root)."""
    return Settings()
