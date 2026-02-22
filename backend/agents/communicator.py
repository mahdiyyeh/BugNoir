"""
Communicator Agent: orchestrates between Personal Agent and Local Agent.
- Receives what the other person said (local language)
- ONE Gemini call via Personal Agent returns translation + suggested response (English, local, phonetic).
"""
from typing import Optional

from backend.models.schemas import UserContext, SuggestedResponse
from backend.agents.personal_agent import PersonalAgent


class CommunicatorAgent:
    def __init__(self, user_context: UserContext):
        self.user_context = user_context
        self.personal_agent = PersonalAgent()

    def process_other_person_speech(
        self,
        other_person_said_local: str,
        conversation_history_english: Optional[list[str]] = None,
    ) -> tuple[str, SuggestedResponse]:
        """
        Returns (english_translation_of_what_they_said, suggested_response_with_phonetic).
        Uses a single Gemini call inside suggest_response.
        """
        english_translation, suggested = self.personal_agent.get_suggested_response(
            user_context=self.user_context,
            other_person_said_local=other_person_said_local,
            conversation_history_english=conversation_history_english,
        )
        return english_translation, suggested
