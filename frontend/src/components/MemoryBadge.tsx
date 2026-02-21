import React from "react";

export interface MemoryBadgeProps {
  /** Short message e.g. "LOCAL remembered you prefer casual" */
  message: string;
  /** Optional trace URL for observability. */
  traceUrl?: string | null;
}

/**
 * Small badge showing that memory was updated; optional link to LangSmith trace.
 */
export function MemoryBadge({ message, traceUrl }: MemoryBadgeProps) {
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-full bg-slate-700/80 px-3 py-1.5 text-sm text-slate-300">
      <span>{"\u2728"}</span>
      <span>{message}</span>
      {traceUrl && (
        <a
          href={traceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-amber-400 hover:underline"
        >
          Trace
        </a>
      )}
    </div>
  );
}
