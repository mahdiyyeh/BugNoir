"""
Paid.ai Agentic AI — Autonomous billing agent for HackEurope.
Treats every completed "Step Z" translation loop as a distinct, billable event.
"""
from datetime import datetime, timezone
from typing import Any, Optional

from backend.models.schemas import UserContext, SuggestedResponse

# Module-level event log (in production, use a persistent store)
_events: list[dict[str, Any]] = []

# Common idioms / colloquial markers (presence increases complexity)
_IDIOM_PATTERNS = (
    "piece of cake", "break a leg", "hit the road", "cost an arm", "once in a blue moon",
    "coup de", "n\'importe quoi", "bof", "trop", "genre", "grave", "kiffer", "truc",
    "machin", "bagnole", "bouffer", "kif", "wesh", "inchallah", "wallah", "yallah",
    "inshallah", "habibi", "chouia", "b'slama", "safi", "zwin", "daba", "daba",
    "bghiti", "kayen", "ma3andich", "allah", "bizarre", "dingue", "chelou",
)


def _slang_intensity_score(slang_level: str) -> int:
    """0–3 points from slang preference."""
    s = (slang_level or "").strip().lower()
    if "down with the kids" in s:
        return 3
    if "friendly" in s:
        return 2
    if "moderate" in s:
        return 2
    if "minimal" in s:
        return 1
    return 0


def _idiom_detection_score(text: str) -> int:
    """0–2 points if idiom/colloquial markers detected."""
    if not text:
        return 0
    t = text.lower()
    for phrase in _IDIOM_PATTERNS:
        if phrase in t:
            return 2
    return 0


class ValueTracker:
    """
    Autonomous billing agent: calculates value per task and records billable outcomes
    for the Paid.ai Agentic AI track.
    """

    def record_step_z(
        self,
        *,
        user_context: Optional[UserContext] = None,
        conversation_turn_index: int = 0,
        other_person_said_local: str = "",
        english_translation: str = "",
        suggested_english: str = "",
        suggested_local: str = "",
        phonetic_spelling: str = "",
        slang_level: Optional[str] = None,
    ) -> dict[str, Any]:
        """
        Record one completed Step Z translation loop as a billable event.
        Dynamically calculates complexity_score from turns, slang intensity, and idiom detection.
        Returns the recorded event (including estimated_cost_eur).
        """
        slang_level = slang_level or (user_context.onboarding.slang_level if user_context else None) or ""
        combined_text = f"{other_person_said_local} {english_translation} {suggested_english} {suggested_local}".strip()

        # Base from conversation position (later turns = more context)
        turn_score = min(4, 1 + (conversation_turn_index // 2))

        # Slang intensity (0–3)
        slang_score = _slang_intensity_score(slang_level)

        # Idiom/colloquial detection (0–2)
        idiom_score = _idiom_detection_score(combined_text)

        # Phonetic length (non-trivial = +1)
        phonetic_bonus = 1 if (phonetic_spelling or "").strip() and len((phonetic_spelling or "").strip()) > 10 else 0

        # Word count of utterance (1–3)
        word_count = len((other_person_said_local or "").split())
        if word_count <= 2:
            word_score = 1
        elif word_count <= 6:
            word_score = 2
        else:
            word_score = 3

        complexity_score = turn_score + slang_score + idiom_score + phonetic_bonus + word_score
        complexity_score = max(1, min(10, complexity_score))

        # Mock billing: estimated_cost_eur per outcome
        base_eur = 0.02
        estimated_cost_eur = round(base_eur * complexity_score + 0.01 * (conversation_turn_index + 1), 2)

        timestamp = datetime.now(timezone.utc).isoformat()
        event = {
            "event_type": "step_z",
            "complexity_score": complexity_score,
            "conversation_turn_index": conversation_turn_index,
            "slang_intensity_score": slang_score,
            "idiom_detected": idiom_score > 0,
            "estimated_cost_eur": estimated_cost_eur,
            "timestamp": timestamp,
            "destination": getattr(user_context.onboarding, "location", None) if user_context else None,
            "occasion": getattr(user_context.onboarding, "occasion", None) if user_context else None,
        }
        _events.append(event)
        return event

    def score_interaction(
        self,
        user_context: UserContext,
        other_person_said_local: str,
        suggested_response: SuggestedResponse,
    ) -> dict[str, Any]:
        """
        Legacy: score one REST interaction (used by /api/conversation/process).
        Also appends to the same event log for dashboard consistency.
        """
        complexity_score = 0
        slang = (user_context.onboarding.slang_level or "").strip()
        if "Down with the kids" in slang or slang.lower() == "down with the kids":
            complexity_score += 3
        elif "Friendly" in slang:
            complexity_score += 2
        elif "Moderate" in slang:
            complexity_score += 2
        elif "Minimal" in slang:
            complexity_score += 1

        word_count = len((other_person_said_local or "").split())
        if word_count <= 2:
            complexity_score += 1
        elif word_count <= 5:
            complexity_score += 2
        elif word_count <= 10:
            complexity_score += 3
        else:
            complexity_score += 4

        if (suggested_response.phonetic or "").strip() and len((suggested_response.phonetic or "").strip()) > 10:
            complexity_score += 1

        complexity_score = max(1, min(10, complexity_score))

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
            "event_type": "rest_interaction",
            "complexity_score": complexity_score,
            "interaction_type": interaction_type,
            "estimated_value_eur": estimated_value_eur,
            "estimated_cost_eur": estimated_value_eur,
            "timestamp": timestamp,
        }
        _events.append(event)
        return event

    def get_summary(self) -> dict[str, Any]:
        """Return billing summary for the Paid.ai dashboard."""
        total = len(_events)
        total_cost = sum(e.get("estimated_cost_eur", e.get("estimated_value_eur", 0)) for e in _events)
        avg_complexity = (sum(e.get("complexity_score", 0) for e in _events) / total) if total else 0.0
        return {
            "total_events": total,
            "total_cost_eur": round(total_cost, 2),
            "average_complexity": round(avg_complexity, 2),
        }

    def get_recent_events(self, limit: int = 50) -> list[dict[str, Any]]:
        """Return most recent billable events (newest first)."""
        return list(reversed(_events[-limit:]))

    def get_dashboard(self) -> dict[str, Any]:
        """Legacy: full dashboard payload (summary + log)."""
        summary = self.get_summary()
        return {
            "total_interactions": summary["total_events"],
            "total_value_eur": summary["total_cost_eur"],
            "total_cost_eur": summary["total_cost_eur"],
            "average_complexity": summary["average_complexity"],
            "log": self.get_recent_events(100),
        }
