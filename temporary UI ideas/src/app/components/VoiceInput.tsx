import { Mic } from 'lucide-react';

interface VoiceInputProps {
  placeholder?: string;
}

export function VoiceInput({ placeholder = "Or speak your answer..." }: VoiceInputProps) {
  return (
    <div className="relative">
      <div
        className="flex items-center gap-3 px-6 py-4 rounded-[24px] border border-white"
        style={{
          background: 'var(--glass-bg)',
          backdropFilter: 'blur(var(--glass-blur))',
          WebkitBackdropFilter: 'blur(var(--glass-blur))',
        }}
      >
        <Mic className="w-5 h-5 text-[var(--rbt-royal-blue)]" />
        <span className="font-['Libre_Baskerville',_serif] text-[var(--rbt-deep-slate)] opacity-60">
          {placeholder}
        </span>
      </div>
    </div>
  );
}
