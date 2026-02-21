import React, { useState } from "react";

export interface OnboardingFormProps {
  /** Demo user ID (hardcoded for hackathon). */
  defaultUserId?: string;
  onSubmit: (userId: string) => void;
}

/**
 * Simple onboarding: capture user_id for demo. No real auth.
 */
export function OnboardingForm({ defaultUserId = "", onSubmit }: OnboardingFormProps) {
  const [userId, setUserId] = useState(defaultUserId || "demo-user-001");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(userId.trim() || "demo-user-001");
  };

  return (
    <form onSubmit={handleSubmit} className="rounded-lg bg-slate-800/50 p-6 shadow-lg">
      <label className="mb-2 block text-sm font-medium text-slate-300">
        Your demo user ID
      </label>
      <input
        type="text"
        value={userId}
        onChange={(e) => setUserId(e.target.value)}
        placeholder="demo-user-001"
        className="mb-4 w-full rounded border border-slate-600 bg-slate-900 px-3 py-2 text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none"
      />
      <button
        type="submit"
        className="w-full rounded bg-amber-600 px-4 py-2 font-medium text-white hover:bg-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-400"
      >
        Start LOCAL
      </button>
    </form>
  );
}
