"""PAID Agentic AI value-tracking for HackEurope."""
from datetime import datetime, timezone
from typing import Any

from backend.models.schemas import UserContext, SuggestedResponse

# Module-level log of scored interactions
log: list[dict[str, Any]] = []


class ValueTracker:
    def score_interaction(
        self,
        user_context: UserContext,
        other_person_said_local: str,
        suggested_response: SuggestedResponse,
    ) -> dict[str, Any]:
        """
        Returns a dict with complexity_score (1-10), interaction_type, estimated_value_eur, timestamp.
        """
        complexity_score = 0

        # Slang level: "Down with the kids" = +3, "None" = 0, etc.
        slang = (user_context.onboarding.slang_level or "").strip()
        if "Down with the kids" in slang or slang.lower() == "down with the kids":
            complexity_score += 3
        elif "Friendly" in slang:
            complexity_score += 2
        elif "Moderate" in slang:
            complexity_score += 2
        elif "Minimal" in slang:
            complexity_score += 1
        # "None" = 0

        # Word count of other person's utterance -> 1-4 points
        word_count = len((other_person_said_local or "").split())
        if word_count <= 2:
            complexity_score += 1
        elif word_count <= 5:
            complexity_score += 2
        elif word_count <= 10:
            complexity_score += 3
        else:
            complexity_score += 4

        # Non-trivial phonetic (len > 10) = +1
        if (suggested_response.phonetic or "").strip() and len((suggested_response.phonetic or "").strip()) > 10:
            complexity_score += 1

        complexity_score = max(1, min(10, complexity_score))

        # Classify interaction type by keyword matching
        text_lower = (other_person_said_local or "").lower() + " " + (suggested_response.english or "").lower()
        if any(w in text_lower for w in ("hello", "hi", "bonjour", "salut", "hey", "good morning", "good evening")):
            interaction_type = "greeting"
        elif any(w in text_lower for w in ("help", "emergency", "urgent", "au secours", "aide")):
            interaction_type = "emergency"
        elif any(w in text_lower for w in ("price", "cost", "pay", "euro", "prix", "acheter", "buy", "bill")):
            interaction_type = "transaction"
        elif any(w in text_lower for w in ("meeting", "report", "client", "project", "business", "réunion")):
            interaction_type = "professional"
        else:
            interaction_type = "social"

        estimated_value_eur = round(complexity_score * 0.05, 2)
        timestamp = datetime.now(timezone.utc).isoformat()

        event = {
            "complexity_score": complexity_score,
            "interaction_type": interaction_type,
            "estimated_value_eur": estimated_value_eur,
            "timestamp": timestamp,
        }
        log.append(event)
        return event

    def get_dashboard(self) -> dict[str, Any]:
        total = len(log)
        total_value = sum(e["estimated_value_eur"] for e in log)
        avg_complexity = (sum(e["complexity_score"] for e in log) / total) if total else 0.0
        return {
            "total_interactions": total,
            "total_value_eur": round(total_value, 2),
            "average_complexity": round(avg_complexity, 2),
            "log": list(log),
        }
