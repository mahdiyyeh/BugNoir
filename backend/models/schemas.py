"""Pydantic models for Local Polyglot Friend API."""
from enum import Enum

from pydantic import BaseModel, Field


class LocationOption(str, Enum):
    PARIS = "paris"
    LONDON = "london"
    MOROCCO = "morocco"


# Onboarding question 1: personality
PERSONALITY_OPTIONS = ["Energetic", "Charismatic", "Sweet", "Cool", "Rude", "Smart"]
# Q2: occasion
OCCASION_OPTIONS = ["Holiday", "Social", "Professional", "Business", "Interview", "Love"]
# Q3: pronunciation difficulty
PRONUNCIATION_OPTIONS = ["Easy", "Medium", "Hard"]
# Q4: slang level
SLANG_OPTIONS = ["Down with the kids", "Friendly", "Moderate", "Minimal", "None"]


class OnboardingAnswers(BaseModel):
    """User answers from the 7 onboarding questions."""
    location: LocationOption
    personality: str = Field(..., description="E.g. Energetic, Charismatic, ...")
    occasion: str = Field(..., description="E.g. Holiday, Business, ...")
    pronunciation_difficulty: str = Field(..., description="Easy, Medium, Hard")
    slang_level: str = Field(..., description="Slang preference")
    profession: str = Field(..., description="Free text")
    hobbies: str = Field(..., description="Free text")


class UserContext(BaseModel):
    """Full user context for the Personal Agent (from onboarding + session)."""
    onboarding: OnboardingAnswers
    native_language: str = "en"
    target_language: str = "fr"
    target_region: str = "Paris"


class SuggestedResponse(BaseModel):
    """Suggested response with English, local language, and phonetic."""
    english: str
    local: str
    phonetic: str = Field(..., description="Phonetic spelling for pronunciation")
