"""Gemini API client for translation, suggestions, and agent reasoning.
Uses the google-genai SDK (Gemini Developer API)."""
import json
import os
from typing import Optional

from google import genai
from google.genai import types

try:
    from google.genai.errors import ClientError
except ImportError:
    ClientError = Exception  # noqa: A001

from backend.models.schemas import UserContext, SuggestedResponse

# Model IDs to try (Gemini Developer API). Order: prefer newer, then common fallbacks.
GEMINI_MODELS = (
    "gemini-2.5-flash",
    "gemini-2.5-pro",
    "gemini-2.0-flash",
    "gemini-1.5-flash-latest",
    "gemini-1.5-pro",
    "gemini-1.5-pro-latest",
    "gemini-pro",
)


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
        except (ClientError, Exception) as e:
            last_error = e
            err_str = str(e).lower()
            if "not found" in err_str or "404" in err_str or "not_found" in err_str:
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
    other_person_said_local: str,
    conversation_history_english: Optional[list[str]] = None,
) -> tuple[str, SuggestedResponse]:
    """
    ONE Gemini call: returns (english_translation, suggested_response).
    JSON fields: english_translation, suggested_english, suggested_local, suggested_phonetic.
    """
    ctx = user_context.onboarding
    history = ""
    if conversation_history_english:
        history = "Recent exchange (English): " + " | ".join(conversation_history_english[-6:])

    target_lang = user_context.target_language
    region = user_context.target_region
    morocco_instruction = ""
    if region == "Morocco" or "Darija" in target_lang:
        morocco_instruction = " The user is travelling to Morocco. Use Moroccan Darija Arabic, not Modern Standard Arabic. Use common Moroccan phrases."

    prompt = f"""You are a polyglot coach helping a traveler have a natural conversation in {target_lang} ({region}).{morocco_instruction}

User profile:
- How they want to come across: {ctx.personality}
- Trip occasion: {ctx.occasion}
- Pronunciation comfort: {ctx.pronunciation_difficulty}
- Slang level: {ctx.slang_level}
- Profession: {ctx.profession}
- Hobbies: {ctx.hobbies}

The other person just said (in local language): {other_person_said_local}
{history}

Do ALL of the following in one response as JSON only (no markdown, no explanation):
1. Provide "english_translation": the English translation of what the other person said.
2. Suggest a short, natural reply the user could say next, in English ("suggested_english"), then in the target language ("suggested_local"), matching their personality and occasion (one or two short sentences).
3. Provide "suggested_phonetic": a simple phonetic spelling in Latin script for "suggested_local" so an English speaker can pronounce it (e.g. "oo" for u, "ay" for é). One line only.

Return ONLY a valid JSON object with exactly these keys: english_translation, suggested_english, suggested_local, suggested_phonetic."""

    client = _get_client()
    last_error = None
    for model in GEMINI_MODELS:
        try:
            response = client.models.generate_content(
                model=model,
                contents=prompt,
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                ),
            )
            text = (response.text or "").strip()
            if not text:
                raise ValueError("Empty response")
            # Remove markdown code block if present
            if text.startswith("```"):
                text = text.split("\n", 1)[-1].rsplit("```", 1)[0].strip()
            data = json.loads(text)
            english_translation = (data.get("english_translation") or "").strip() or other_person_said_local or ""
            suggested_english = (data.get("suggested_english") or "I'm sorry, I didn't catch that.").strip().strip('"\n ')
            suggested_local = (data.get("suggested_local") or suggested_english).strip()
            suggested_phonetic = (data.get("suggested_phonetic") or suggested_local).strip()
            return english_translation, SuggestedResponse(
                english=suggested_english,
                local=suggested_local,
                phonetic=suggested_phonetic,
            )
        except (ClientError, Exception) as e:
            last_error = e
            err_str = str(e).lower()
            if "not found" in err_str or "404" in err_str or "not_found" in err_str:
                continue
            raise
    raise last_error or RuntimeError("No model available")


def detect_end_phrase(spoken: str, local_language: str = "French") -> bool:
    """Return True if user said goodbye (e.g. 'Au revoir' in French)."""
    spoken_lower = spoken.strip().lower()
    if "au revoir" in spoken_lower or "goodbye" in spoken_lower or "bye" in spoken_lower:
        return True
    prompt = f"""Does this user message mean they are ending the conversation / saying goodbye in {local_language} or English? Answer only YES or NO.
User said: {spoken}"""
    text = _generate(prompt).upper()
    return text.startswith("YES")
