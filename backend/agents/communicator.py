"""
Communicator Agent: orchestrates between Personal Agent and Local Agent.
- Receives what the other person said (local language)
- Uses Local Agent to translate to English
- Uses Personal Agent to suggest response (English) then Local Agent for local + phonetic
"""
from typing import Optional

from backend.models.schemas import UserContext, SuggestedResponse
from backend.agents.personal_agent import PersonalAgent
from backend.agents.local_agent import LocalAgent


class CommunicatorAgent:
    def __init__(self, user_context: UserContext):
        self.user_context = user_context
        self.local_agent = LocalAgent(user_context.target_language.capitalize())
        self.personal_agent = PersonalAgent()

    def process_other_person_speech(
        self,
        other_person_said_local: str,
        conversation_history_english: Optional[list[str]] = None,
    ) -> tuple[str, SuggestedResponse]:
        """
        Returns (english_translation_of_what_they_said, suggested_response_with_phonetic).
        """
        english_translation = self.local_agent.to_english(other_person_said_local)
        suggested = self.personal_agent.get_suggested_response(
            user_context=self.user_context,
            other_person_said_english=english_translation,
            other_person_said_local=other_person_said_local,
            conversation_history_english=conversation_history_english,
        )
        return english_translation, suggested
