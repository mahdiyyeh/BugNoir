/**
 * LOCAL API client. All calls async/await.
 * Base URL: same origin (Vite proxy to backend) or env.
 */

const API_BASE = import.meta.env.VITE_API_URL || "";

export interface InteractRequest {
  user_id: string;
  audio_base64: string;
  latitude: number;
  longitude: number;
  location_type: string;
}

export interface InteractResponse {
  variants: { formal: string; casual: string; joking: string };
  recommended: string;
  audio_url: string | null;
  langsmith_trace_url: string | null;
}

/**
 * POST /interact — main flow: send audio + location, get response variants + optional TTS.
 */
export async function interact(req: InteractRequest): Promise<InteractResponse> {
  const res = await fetch(`${API_BASE}/interact`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(req),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(err || `HTTP ${res.status}`);
  }
  return res.json() as Promise<InteractResponse>;
}

/**
 * GET /health — check backend is up.
 */
export async function health(): Promise<{ status: string }> {
  const res = await fetch(`${API_BASE}/health`);
  if (!res.ok) throw new Error(`Health check failed: ${res.status}`);
  return res.json() as Promise<{ status: string }>;
}
