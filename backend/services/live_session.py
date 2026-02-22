"""
Gemini Live API — real-time bidirectional audio + tool calls.
Used by /ws/translate for Best Use of Gemini track.
"""
from __future__ import annotations

import asyncio
from typing import Any, Callable, Optional

from backend.config import get_settings


def build_system_prompt(context: dict[str, Any]) -> str:
    """Build a strong system prompt from user context (destination, occasion, slang_level, etc.)."""
    destination = context.get("destination") or context.get("target_region") or "Paris"
    target_language = context.get("target_language") or "French"
    occasion = context.get("occasion") or "Social"
    slang_level = context.get("slang_level") or "Moderate"
    personality = context.get("personality") or "Friendly"
    profession = context.get("profession") or ""
    hobbies = context.get("hobbies") or ""

    return f"""You are a polyglot conversation coach for "Local: Your Mutual Polyglot Friend". The user is in {destination} and practising {target_language}.

User profile:
- How they want to come across: {personality}
- Trip occasion: {occasion}
- Slang level: {slang_level}
- Profession: {profession}
- Hobbies: {hobbies}

Your role:
1. Listen to the other person (they speak in {target_language}) and to the user (they may speak in English or attempt {target_language}).
2. When the other person speaks, respond with a tool call containing exactly:
   - english_translation: what they said in English
   - local_spelling: the phrase in {target_language} (correct spelling)
   - phonetic_spelling: simple Latin-script pronunciation guide for the user (e.g. "bon-JOOR" for "bonjour")
3. When the user asks for a suggested reply, provide a short natural phrase in English, then in {target_language}, with phonetic_spelling.
4. Keep responses concise and practical for real-time conversation.
"""


async def run_live_session(
    context: dict[str, Any],
    audio_in: asyncio.Queue[bytes],
    audio_out: asyncio.Queue[bytes],
    tool_out: asyncio.Queue[dict[str, Any]],
    turn_callback: Optional[Callable[[int, dict[str, Any]], None]] = None,
) -> None:
    """
    Run a Gemini Live session: consume PCM from audio_in, push audio to audio_out and tool calls to tool_out.
    turn_callback(turn_index, tool_payload) is called each time Gemini completes a turn (for ValueTracker).
    """
    try:
        from google import genai
        from google.genai import types
    except ImportError:
        await tool_out.put({
            "error": "google-genai not installed",
            "phonetic_spelling": "",
            "local_spelling": "",
            "english_translation": "",
        })
        return

    try:
        settings = get_settings()
        api_key = settings.get_live_api_key() or settings.get_gemini_api_key()
    except Exception as e:
        await tool_out.put({
            "error": str(e),
            "phonetic_spelling": "",
            "local_spelling": "",
            "english_translation": "",
        })
        return

    client = genai.Client(api_key=api_key)
    system_instruction = build_system_prompt(context)

    # Live-capable model (adjust if your key has access to a different live model)
    model = "gemini-2.0-flash-live-001"
    config = types.LiveConnectConfig(
        system_instruction=types.Content(role="user", parts=[types.Part.from_text(system_instruction)]),
    )

    turn_index = [0]  # mutable so inner closure can increment

    async def send_audio_loop() -> None:
        while True:
            try:
                chunk = await asyncio.wait_for(audio_in.get(), timeout=300.0)
            except asyncio.TimeoutError:
                break
            if chunk is None:
                break
            try:
                await session.send_realtime_input(
                    media=types.Blob(data=chunk, mime_type="audio/pcm;rate=16000"),
                )
            except Exception:
                break

    async def receive_loop() -> None:
        try:
            async for msg in session.receive():
                if getattr(msg, "tool_call", None):
                    tc = msg.tool_call
                    args = getattr(tc, "args", None) or {}
                    payload = {
                        "phonetic_spelling": args.get("phonetic_spelling", ""),
                        "local_spelling": args.get("local_spelling", ""),
                        "english_translation": args.get("english_translation", ""),
                    }
                    await tool_out.put(payload)
                    if turn_callback:
                        turn_callback(turn_index[0], payload)
                    turn_index[0] += 1
                if getattr(msg, "inline_data", None):
                    await audio_out.put(msg.inline_data.data)
        except Exception:
            pass

    try:
        async with client.aio.live.connect(model=model, config=config) as session:
            await asyncio.gather(send_audio_loop(), receive_loop())
    except Exception as e:
        await tool_out.put({
            "error": str(e),
            "phonetic_spelling": "",
            "local_spelling": "",
            "english_translation": "",
        })
