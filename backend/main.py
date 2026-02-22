"""
Local: Your Mutual Polyglot Friend — FastAPI backend.
Run from repo root: uvicorn backend.main:app --reload
"""
import os
import uuid
from contextlib import asynccontextmanager
from typing import Optional

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from backend.models.schemas import (
    OnboardingAnswers,
    UserContext,
    LocationOption,
)
from backend.agents.communicator import CommunicatorAgent
from backend.services.gemini_client import detect_end_phrase
from backend.services.value_tracker import ValueTracker

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
    return "en", "fr"


def _location_to_region(loc: LocationOption) -> str:
    return {"paris": "Paris", "london": "London", "morocco": "Morocco"}.get(
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
    target_lang_name = {"fr": "French", "ar": "Moroccan Darija (Arabic)"}.get(target, "French")
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


@app.get("/api/health")
def health() -> dict:
    return {"status": "ok", "gemini_configured": bool(os.getenv("GEMINI_API_KEY"))}
