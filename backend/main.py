"""
LOCAL — AI Personal Local Guide. Main FastAPI app and POST /interact.
"""
import os
import base64
import logging
from dotenv import load_dotenv

load_dotenv()

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from backend.models.schemas import InteractRequest, InteractResponse
from backend.agents import get_personality, resolve_context, generate_variants, update_memory
from backend.services.whisper_client import transcribe
from backend.services.elevenlabs_client import text_to_speech

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="LOCAL API",
    description="Multi-agent AI local guide: personality + Paris context → response variants",
    version="0.1.0",
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def _get_langsmith_trace_url() -> str | None:
    """If LangSmith is configured, return current trace URL (placeholder; wire real trace ID when LANGSMITH is live)."""
    if os.getenv("LANGCHAIN_TRACING_V2", "").lower() == "true" and os.getenv("LANGSMITH_API_KEY"):
        # TODO: integrate real LangSmith trace ID from langchain callbacks
        return "https://smith.langchain.com/o/default/projects/local-hackathon"
    return None


@app.post("/interact", response_model=InteractResponse)
async def interact(body: InteractRequest) -> InteractResponse:
    """
    Main flow: STT → PersonalityParser → ContextResolver → ResponseGenerator → TTS (optional) → MemoryUpdater.
    Returns variants (formal, casual, joking), recommended, optional audio_url, optional langsmith_trace_url.
    """
    try:
        # 1. STT
        transcript = transcribe(body.audio_base64)
        if not transcript:
            transcript = "How do I ask to split the bill?"

        # 2. PersonalityParser
        personality = get_personality(body.user_id)

        # 3. ContextResolver
        context = resolve_context(body.latitude, body.longitude, body.location_type)

        # 4. ResponseGenerator
        variants, recommended = generate_variants(transcript, personality, context)
        recommended_text = variants.get(recommended, variants["casual"])

        # 5. TTS (optional)
        audio_b64 = text_to_speech(recommended_text)
        audio_url = None
        if audio_b64:
            audio_url = f"data:audio/mpeg;base64,{audio_b64}"

        # 6. MemoryUpdater
        update_memory(
            body.user_id,
            personality,
            transcript,
            recommended,
            recommended_text,
            body.location_type,
        )

        trace_url = _get_langsmith_trace_url()
        return InteractResponse(
            variants=variants,
            recommended=recommended,
            audio_url=audio_url,
            langsmith_trace_url=trace_url,
        )
    except Exception as e:
        logger.exception("Interact failed: %s", e)
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/health")
async def health():
    """Health check for deployment."""
    return {"status": "ok", "service": "local"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
