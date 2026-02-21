import React from "react";

export type VariantKey = "formal" | "casual" | "joking";

export interface ResponseCardProps {
  variants: { formal: string; casual: string; joking: string };
  recommended: string;
  /** Optional: play TTS from this URL (data URL or blob URL). */
  audioUrl?: string | null;
}

/**
 * Renders the three response variants and highlights the recommended one.
 */
export function ResponseCard({ variants, recommended, audioUrl }: ResponseCardProps) {
  const keys: VariantKey[] = ["formal", "casual", "joking"];
  const [playing, setPlaying] = React.useState(false);
  const audioRef = React.useRef<HTMLAudioElement | null>(null);

  const handlePlay = () => {
    if (!audioUrl) return;
    if (!audioRef.current) {
      const a = new Audio(audioUrl);
      a.onended = () => setPlaying(false);
      audioRef.current = a;
    }
    if (playing) {
      audioRef.current?.pause();
      audioRef.current.currentTime = 0;
      setPlaying(false);
    } else {
      audioRef.current?.play();
      setPlaying(true);
    }
  };

  return (
    <div className="rounded-lg bg-slate-800/50 p-6 shadow-lg">
      <h3 className="mb-4 text-lg font-semibold text-white">Your LOCAL answers</h3>
      <div className="space-y-4">
        {keys.map((key) => (
          <div
            key={key}
            className={`rounded border p-3 ${
              key === recommended
                ? "border-amber-500 bg-amber-500/10"
                : "border-slate-600 bg-slate-900/50"
            }`}
          >
            <span className="mb-1 block text-xs font-medium uppercase text-slate-400">
              {key}
              {key === recommended && " (recommended)"}
            </span>
            <p className="text-slate-200">{variants[key]}</p>
          </div>
        ))}
      </div>
      {audioUrl && (
        <button
          type="button"
          onClick={handlePlay}
          className="mt-4 rounded bg-slate-700 px-4 py-2 text-sm text-white hover:bg-slate-600"
        >
          {playing ? "Pause" : "Play"} audio
        </button>
      )}
    </div>
  );
}
