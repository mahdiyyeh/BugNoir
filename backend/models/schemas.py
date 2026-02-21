"""
Pydantic models for all request/response shapes.
"""
from pydantic import BaseModel, Field
from typing import Optional


class InteractRequest(BaseModel):
    """Request body for POST /interact."""
    user_id: str = Field(..., description="User UUID (hardcoded for demo)")
    audio_base64: str = Field(..., description="Base64-encoded audio from frontend")
    latitude: float = Field(..., description="GPS latitude")
    longitude: float = Field(..., description="GPS longitude")
    location_type: str = Field(..., description="e.g. brasserie, museum, metro")


class InteractResponse(BaseModel):
    """Response from POST /interact."""
    variants: dict = Field(
        ...,
        description="formal, casual, joking response variants"
    )
    recommended: str = Field(..., description="Which variant is recommended")
    audio_url: Optional[str] = Field(None, description="TTS audio URL or base64")
    langsmith_trace_url: Optional[str] = Field(None, description="LangSmith trace URL for observability")


class PersonalityProfile(BaseModel):
    """User personality profile from Pinecone / fallback."""
    user_id: str
    summary: str = ""
    preferences: list[str] = Field(default_factory=list)
    raw: Optional[dict] = None


class ResolvedContext(BaseModel):
    """Local context from RAG over paris_knowledge_base."""
    location_type: str
    snippets: list[str] = Field(default_factory=list)
    raw: Optional[dict] = None
