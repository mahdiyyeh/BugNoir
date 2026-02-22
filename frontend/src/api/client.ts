const API_BASE = '/api';

export type OnboardingAnswers = {
  location: 'paris' | 'london' | 'morocco';
  personality: string;
  occasion: string;
  pronunciation_difficulty: string;
  slang_level: string;
  profession: string;
  hobbies: string;
};

export type OnboardingResponse = {
  session_id: string;
  target_language: string;
  target_region: string;
};

export type SuggestedResponse = {
  english: string;
  local: string;
  phonetic: string;
};

export type ProcessTurnResponse = {
  other_person_said_english: string;
  suggested_response: SuggestedResponse;
};

export async function submitOnboarding(answers: OnboardingAnswers): Promise<OnboardingResponse> {
  const res = await fetch(`${API_BASE}/onboarding`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(answers),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function markArrived(sessionId: string): Promise<{ message: string; region: string }> {
  const res = await fetch(`${API_BASE}/arrive`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ session_id: sessionId }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function processTurn(
  sessionId: string,
  otherPersonSaidLocal: string
): Promise<ProcessTurnResponse> {
  const res = await fetch(`${API_BASE}/conversation/process`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      session_id: sessionId,
      other_person_said_local: otherPersonSaidLocal,
    }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function confirmUserSaid(
  sessionId: string,
  userSaid: string,
  suggestedLocal: string
): Promise<{ conversation_ended: boolean }> {
  const res = await fetch(`${API_BASE}/conversation/confirm`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      session_id: sessionId,
      user_said: userSaid,
      suggested_local: suggestedLocal,
    }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export type DashboardLogEntry = {
  complexity_score: number;
  interaction_type: string;
  estimated_value_eur: number;
  timestamp: string;
};

export async function getDashboard(): Promise<{
  total_interactions: number;
  total_value_eur: number;
  average_complexity: number;
  log: DashboardLogEntry[];
}> {
  const res = await fetch(`${API_BASE}/dashboard`);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
