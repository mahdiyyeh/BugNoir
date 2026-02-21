"""
ResponseGenerator agent: calls Gemini with personality + context, returns 3 variants.
(Formal, casual, joking.) Wrapped in try/except with mock fallback.
"""
import logging
from backend.models.schemas import PersonalityProfile, ResolvedContext
from backend.services import gemini_client

logger = logging.getLogger(__name__)


def generate_variants(
    transcript: str,
    personality: PersonalityProfile,
    context: ResolvedContext,
) -> tuple[dict, str]:
    """
    Call Gemini to produce formal, casual, joking variants.
    Returns (variants dict, recommended key).
    """
    context_text = "\n".join(context.snippets) if context.snippets else "General Paris tips."
    personality_text = personality.summary or "Friendly tourist."
    prompt = f"""You are a local Paris guide. The user said: "{transcript}"

User personality: {personality_text}
Relevant local context: {context_text}

Respond with exactly three short variants of the same answer, in JSON only, no other text:
{{
  "formal": "one formal, polite phrase or short paragraph",
  "casual": "one casual, friendly phrase or short paragraph",
  "joking": "one light-hearted or joking phrase or short paragraph"
}}
Recommend "casual" for this user unless they prefer formal. Output only the JSON object."""

    try:
        raw = gemini_client.generate(prompt)
        # Parse JSON from response (may be wrapped in markdown)
        import re
        json_match = re.search(r"\{[\s\S]*\}", raw)
        if json_match:
            import json
            data = json.loads(json_match.group())
            formal = data.get("formal", "").strip() or "L'addition, s'il vous plaît. (The bill, please.)"
            casual = data.get("casual", "").strip() or "On peut payer séparément ? (Can we pay separately?)"
            joking = data.get("joking", "").strip() or "On partage la note comme les bons amis ? (Shall we split it like good friends?)"
            variants = {"formal": formal, "casual": casual, "joking": joking}
            recommended = "casual" if "casual" in (personality.preferences or []) else "casual"
            return variants, recommended
    except Exception as e:
        logger.warning("ResponseGenerator parse failed: %s", e)

    # Fallback
    variants = {
        "formal": "Vous pouvez demander : « L'addition, s'il vous plaît » pour l'ensemble, ou « Pouvons-nous payer séparément ? » pour partager.",
        "casual": "Just say « On peut payer séparément ? » — totally normal in a brasserie.",
        "joking": "« On partage la note ? » — they'll get it, and it's very Parisian to split.",
    }
    return variants, "casual"
