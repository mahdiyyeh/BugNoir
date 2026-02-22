"""
Local: Your Mutual Polyglot Friend — FastAPI backend.
Run from repo root: uvicorn backend.main:app --reload
"""
import asyncio
import json
import os
import uuid
from contextlib import asynccontextmanager
from typing import Any, Optional

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from backend.config import get_settings
from backend.models.schemas import (
    OnboardingAnswers,
    UserContext,
    LocationOption,
)
from backend.agents.communicator import CommunicatorAgent
from backend.services.gemini_client import detect_end_phrase
from backend.services.value_tracker import ValueTracker
from backend.services.live_session import run_live_session

value_tracker = ValueTracker()

load_dotenv()

# In-memory session store (use Redis/DB in production)
sessions: dict[str, dict] = {}


def _location_to_languages(loc: LocationOption) -> tuple[str, str]:
    if loc == LocationOption.PARIS:
        return "en", "fr"
    if loc == LocationOption.LONDON:
        return "en", "fr"  # User is English-speaking, practising French in London (French community context)
    if loc == LocationOption.MOROCCO:
        return "en", "ar"
    if loc == LocationOption.BULGARIA:
        return "en", "bg"
    return "en", "fr"


def _location_to_region(loc: LocationOption) -> str:
    return {"paris": "Paris", "london": "London", "morocco": "Morocco", "bulgaria": "Bulgaria"}.get(
        loc.value, "Paris"
    )


@asynccontextmanager
async def lifespan(app: FastAPI):
    yield
    sessions.clear()


app = FastAPI(
    title="Local — Polyglot Friend",
    description="Agentic AI: voice-first conversation coach for travelers",
    lifespan=lifespan,
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.post("/api/onboarding")
def submit_onboarding(answers: OnboardingAnswers) -> dict:
    """
    Submit onboarding answers; returns session_id and user_context for client.
    """
    native, target = _location_to_languages(answers.location)
    region = _location_to_region(answers.location)
    target_lang_name = {"fr": "French", "ar": "Moroccan Darija (Arabic)", "bg": "Bulgarian"}.get(target, "French")
    user_context = UserContext(
        onboarding=answers,
        native_language=native,
        target_language=target_lang_name,
        target_region=region,
    )
    session_id = str(uuid.uuid4())
    sessions[session_id] = {
        "user_context": user_context.model_dump(),
        "conversation_history_english": [],
        "arrived": False,
        "last_other_said": "",
    }
    return {
        "session_id": session_id,
        "target_language": target_lang_name,
        "target_region": region,
    }


class ArriveBody(BaseModel):
    session_id: str


class ProcessTurnBody(BaseModel):
    session_id: str
    other_person_said_local: str


class ConfirmBody(BaseModel):
    session_id: str
    user_said: str
    suggested_local: str


@app.post("/api/arrive")
def mark_arrived(body: ArriveBody) -> dict:
    """User clicked 'I'm here' at location."""
    session_id = body.session_id
    if session_id not in sessions:
        raise HTTPException(status_code=404, detail="Session not found")
    sessions[session_id]["arrived"] = True
    region = sessions[session_id]["user_context"]["target_region"]
    return {"message": f"Welcome to {region}", "region": region}


@app.post("/api/conversation/process")
def process_turn(body: ProcessTurnBody) -> dict:
    """
    STEP Z: Other person spoke in local language.
    Returns translation (English) and suggested response (English + local + phonetic).
    """
    session_id = body.session_id
    other_person_said_local = body.other_person_said_local
    if session_id not in sessions:
        raise HTTPException(status_code=404, detail="Session not found")
    data = sessions[session_id]
    ctx = UserContext(**data["user_context"])
    comm = CommunicatorAgent(ctx)
    history = data.get("conversation_history_english") or []
    english_translation, suggested = comm.process_other_person_speech(
        other_person_said_local, conversation_history_english=history
    )
    data["last_other_said"] = english_translation
    value_event = value_tracker.score_interaction(ctx, other_person_said_local, suggested)
    return {
        "other_person_said_english": english_translation,
        "suggested_response": suggested.model_dump(),
        "value_event": value_event,
    }


@app.post("/api/conversation/confirm")
def confirm_user_said(body: ConfirmBody) -> dict:
    """
    After user attempts to say the suggested phrase, optionally add to history
    and check for end phrase (e.g. Au revoir).
    """
    session_id = body.session_id
    user_said = body.user_said
    if session_id not in sessions:
        raise HTTPException(status_code=404, detail="Session not found")
    data = sessions[session_id]
    history = data.get("conversation_history_english") or []
    last_other = data.get("last_other_said", "")
    history.append(f"Other: {last_other} | You: {user_said}")
    data["conversation_history_english"] = history
    ended = detect_end_phrase(user_said, data["user_context"].get("target_language", "French"))
    return {"conversation_ended": ended}


@app.get("/api/session/{session_id}")
def get_session(session_id: str) -> dict:
    if session_id not in sessions:
        raise HTTPException(status_code=404, detail="Session not found")
    return sessions[session_id]


@app.get("/api/dashboard")
def get_dashboard() -> dict:
    return value_tracker.get_dashboard()


@app.get("/api/value/summary")
def value_summary() -> dict[str, Any]:
    """Paid.ai billing summary: total events, total_cost_eur, average_complexity."""
    return value_tracker.get_summary()


@app.get("/api/value/events")
def value_events(limit: int = 50) -> dict[str, Any]:
    """Paid.ai recent billable events (newest first)."""
    return {"events": value_tracker.get_recent_events(limit=limit)}


@app.websocket("/ws/translate")
async def websocket_translate(websocket: WebSocket) -> None:
    """
    Step A: Expect initial JSON with user context (destination, occasion, slang_level, etc.).
    Step B: Open Gemini Live session with system prompt from context.
    Step C: Concurrent loops: (1) receive PCM from client -> Gemini, (2) receive from Gemini -> client (audio binary, tool calls JSON).
    ValueTracker logs an event on each completed turn.
    """
    await websocket.accept()
    context: Optional[dict[str, Any]] = None
    audio_in: asyncio.Queue[bytes] = asyncio.Queue()
    audio_out: asyncio.Queue[bytes] = asyncio.Queue()
    tool_out: asyncio.Queue[dict[str, Any]] = asyncio.Queue()
    live_tasks: list[asyncio.Task] = []

    def on_turn(turn_index: int, payload: dict[str, Any]) -> None:
        value_tracker.record_step_z(
            conversation_turn_index=turn_index,
            english_translation=payload.get("english_translation", ""),
            suggested_local=payload.get("local_spelling", ""),
            phonetic_spelling=payload.get("phonetic_spelling", ""),
            suggested_english=payload.get("english_translation", ""),
            slang_level=context.get("slang_level") if context else None,
        )

    async def receive_from_client() -> None:
        nonlocal context
        try:
            while True:
                msg = await websocket.receive()
                if "text" in msg and msg["text"]:
                    data = json.loads(msg["text"])
                    if context is None:
                        context = data
                        t = asyncio.create_task(
                            run_live_session(
                                context,
                                audio_in,
                                audio_out,
                                tool_out,
                                turn_callback=on_turn,
                            )
                        )
                        live_tasks.append(t)
                    continue
                if "bytes" in msg and msg["bytes"]:
                    await audio_in.put(msg["bytes"])
        except WebSocketDisconnect:
            pass
        except Exception:
            pass
        finally:
            await audio_in.put(None)

    async def send_tools_to_client() -> None:
        try:
            while True:
                tool_payload = await tool_out.get()
                await websocket.send_text(json.dumps(tool_payload))
        except (WebSocketDisconnect, Exception):
            pass

    async def send_audio_to_client() -> None:
        try:
            while True:
                audio_chunk = await audio_out.get()
                await websocket.send_bytes(audio_chunk)
        except (WebSocketDisconnect, Exception):
            pass

    try:
        await asyncio.gather(
            receive_from_client(),
            send_tools_to_client(),
            send_audio_to_client(),
        )
    finally:
        for t in live_tasks:
            if not t.done():
                t.cancel()
                try:
                    await t
                except asyncio.CancelledError:
                    pass


@app.get("/api/health")
def health() -> dict:
    try:
        s = get_settings()
        gemini_ok = bool(s.gemini_api_key or s.live_translation_api_key)
    except Exception:
        gemini_ok = bool(os.getenv("GEMINI_API_KEY") or os.getenv("LIVE_TRANSLATION_API_KEY"))
    return {"status": "ok", "gemini_configured": gemini_ok}
