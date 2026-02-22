"""Personal/User System Agent: tailors suggested responses using user context."""
from typing import Optional

from backend.models.schemas import UserContext, SuggestedResponse
from backend.services.gemini_client import suggest_response as gemini_suggest


class PersonalAgent:
    """
    Uses onboarding data (personality, occasion, slang, profession, hobbies)
    to suggest contextually appropriate responses for the user.
    """

    @staticmethod
    def get_suggested_response(
        user_context: UserContext,
        other_person_said_local: str,
        conversation_history_english: Optional[list[str]] = None,
    ) -> tuple[str, SuggestedResponse]:
        """Returns (english_translation, suggested_response) from ONE Gemini call."""
        return gemini_suggest(
            user_context=user_context,
            other_person_said_local=other_person_said_local,
            conversation_history_english=conversation_history_english,
        )
