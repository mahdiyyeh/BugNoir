"""Gemini API client for translation, suggestions, and agent reasoning.
Uses the google-genai SDK (Gemini Developer API)."""
import os
from typing import Optional

from google import genai

from backend.models.schemas import UserContext, SuggestedResponse

# Model IDs to try (Gemini Developer API / aistudio.google.com)
GEMINI_MODELS = ("gemini-2.0-flash", "gemini-2.5-flash", "gemini-1.5-flash")


def _get_api_key() -> str:
    key = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")
    if not key:
        raise ValueError("GEMINI_API_KEY environment variable is not set")
    return key


def _get_client() -> genai.Client:
    return genai.Client(api_key=_get_api_key())


def _generate(prompt: str) -> str:
    client = _get_client()
    last_error = None
    for model in GEMINI_MODELS:
        try:
            response = client.models.generate_content(
                model=model,
                contents=prompt,
            )
            if response.text is None:
                return ""
            return response.text.strip()
        except Exception as e:
            last_error = e
            if "not found" in str(e).lower() or "404" in str(e):
                continue
            raise
    raise last_error or RuntimeError("No model available")


def translate_to_english(local_text: str, local_language: str = "French") -> str:
    """Translate from local language to English."""
    prompt = f"""Translate the following {local_language} text to English. Return only the English translation, no explanation.
Text: {local_text}"""
    return _generate(prompt)


def translate_to_local(english_text: str, local_language: str = "French") -> str:
    """Translate from English to local language."""
    prompt = f"""Translate the following English text to {local_language}. Return only the {local_language} translation, no explanation.
Text: {english_text}"""
    return _generate(prompt)


def get_phonetic_spelling(local_text: str, local_language: str = "French") -> str:
    """Return phonetic spelling (e.g. IPA or readable approximation) for the local phrase."""
    prompt = f"""Given this {local_language} phrase, provide a simple phonetic spelling in Latin script so an English speaker can pronounce it. Use common English sounds (e.g. "oo" for u, "ay" for é). One line only, no explanation.
Phrase: {local_text}"""
    result = _generate(prompt)
    return result if result else local_text


def suggest_response(
    user_context: UserContext,
    other_person_said_english: str,
    other_person_said_local: str,
    conversation_history_english: Optional[list[str]] = None,
) -> SuggestedResponse:
    """
    Personal Agent + Local Agent logic: suggest a response in English, then we translate
    to local and add phonetic. Uses user context (personality, occasion, slang, etc.).
    """
    ctx = user_context.onboarding
    history = ""
    if conversation_history_english:
        history = "Recent exchange (English): " + " | ".join(conversation_history_english[-6:])

    prompt = f"""You are a polyglot coach helping a traveler have a natural conversation in {user_context.target_language} ({user_context.target_region}).

User profile:
- How they want to come across: {ctx.personality}
- Trip occasion: {ctx.occasion}
- Pronunciation comfort: {ctx.pronunciation_difficulty}
- Slang level: {ctx.slang_level}
- Profession: {ctx.profession}
- Hobbies: {ctx.hobbies}

The other person just said (in local language): {other_person_said_local}
Translation: {other_person_said_english}
{history}

Suggest a short, natural reply in ENGLISH that the user could say next. Keep it one or two short sentences, matching their personality and occasion. Reply with ONLY the English suggested phrase, nothing else."""

    english = _generate(prompt) or "I'm sorry, I didn't catch that."
    english = english.strip('"\n ')
    local = translate_to_local(english, user_context.target_language.capitalize())
    phonetic = get_phonetic_spelling(local, user_context.target_language.capitalize())
    return SuggestedResponse(english=english, local=local, phonetic=phonetic)


def detect_end_phrase(spoken: str, local_language: str = "French") -> bool:
    """Return True if user said goodbye (e.g. 'Au revoir' in French)."""
    spoken_lower = spoken.strip().lower()
    if "au revoir" in spoken_lower or "goodbye" in spoken_lower or "bye" in spoken_lower:
        return True
    prompt = f"""Does this user message mean they are ending the conversation / saying goodbye in {local_language} or English? Answer only YES or NO.
User said: {spoken}"""
    text = _generate(prompt).upper()
    return text.startswith("YES")
