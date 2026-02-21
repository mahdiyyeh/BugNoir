"""Local Agent: handles translation and phonetic for the target locale."""
from backend.services.gemini_client import (
    translate_to_english,
    translate_to_local,
    get_phonetic_spelling,
)


class LocalAgent:
    """
    Encapsulates local language knowledge: translation (both directions)
    and phonetic spelling for the target region (e.g. Paris French).
    """

    def __init__(self, local_language: str = "French"):
        self.local_language = local_language

    def to_english(self, local_text: str) -> str:
        return translate_to_english(local_text, self.local_language)

    def to_local(self, english_text: str) -> str:
        return translate_to_local(english_text, self.local_language)

    def phonetic(self, local_text: str) -> str:
        return get_phonetic_spelling(local_text, self.local_language)
