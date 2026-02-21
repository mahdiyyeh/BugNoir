import React, { useState } from "react";
import { OnboardingForm } from "./components/OnboardingForm";
import { VoiceInput } from "./components/VoiceInput";
import { ResponseCard } from "./components/ResponseCard";
import { MemoryBadge } from "./components/MemoryBadge";
import { interact, InteractResponse } from "./api/localApi";

// Demo: Paris brasserie
const DEMO_LAT = 48.8566;
const DEMO_LON = 2.3522;
const DEMO_LOCATION = "brasserie";

export default function App() {
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<InteractResponse | null>(null);

  const handleOnboard = (id: string) => setUserId(id);

  const handleRecordingComplete = async (audioBase64: string) => {
    if (!userId) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const data = await interact({
        user_id: userId,
        audio_base64: audioBase64,
        latitude: DEMO_LAT,
        longitude: DEMO_LON,
        location_type: DEMO_LOCATION,
      });
      setResult(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Request failed");
    } finally {
      setLoading(false);
    }
  };

  if (!userId) {
    return (
      <div className="min-h-screen bg-slate-900 p-6 text-white">
        <div className="mx-auto max-w-md">
          <h1 className="mb-2 text-2xl font-bold text-amber-400">LOCAL</h1>
          <p className="mb-6 text-slate-400">AI Personal Local Guide — Paris</p>
          <OnboardingForm defaultUserId="demo-user-001" onSubmit={handleOnboard} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 p-6 text-white">
      <div className="mx-auto max-w-lg space-y-6">
        <header className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-amber-400">LOCAL</h1>
          <span className="text-sm text-slate-500">{userId}</span>
        </header>

        <p className="text-slate-400">
          You’re at a Paris brasserie. Ask anything — e.g. “How do I ask to split the bill?”
        </p>

        <VoiceInput onRecordingComplete={handleRecordingComplete} disabled={loading} />

        {loading && <p className="text-center text-slate-400">Asking LOCAL…</p>}
        {error && <p className="text-center text-red-400">{error}</p>}

        {result && (
          <>
            <ResponseCard
              variants={result.variants}
              recommended={result.recommended}
              audioUrl={result.audio_url}
            />
            <MemoryBadge
              message="LOCAL remembered your preference"
              traceUrl={result.langsmith_trace_url}
            />
          </>
        )}
      </div>
    </div>
  );
}
