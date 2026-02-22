/**
 * Presentational only: cute penguin with headphones, cycling speech bubble, and sound waves.
 * Used on the start page. Respects prefers-reduced-motion via CSS.
 */
export function PenguinTranslator() {
  return (
    <div className="penguin-translator" aria-hidden>
      {/* Speech bubble with cycling greetings */}
      <div className="penguin-speech-bubble">
        <span className="penguin-speech penguin-speech-1">Hello</span>
        <span className="penguin-speech penguin-speech-2">Bonjour</span>
        <span className="penguin-speech penguin-speech-3">Hola</span>
        <span className="penguin-speech penguin-speech-4">こんにちは</span>
      </div>

      {/* Sound wave lines */}
      <div className="penguin-sound-waves">
        <span className="penguin-wave" />
        <span className="penguin-wave" />
        <span className="penguin-wave" />
        <span className="penguin-wave" />
      </div>

      {/* Penguin with headphones */}
      <svg
        className="penguin-svg"
        viewBox="0 0 120 140"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Shadow */}
        <ellipse cx="60" cy="128" rx="28" ry="6" fill="rgba(0,0,0,0.12)" />

        {/* Body */}
        <ellipse cx="60" cy="88" rx="32" ry="42" fill="#1e293b" />
        <ellipse cx="60" cy="92" rx="24" ry="32" fill="#f8fafc" />

        {/* Belly patch */}
        <path
          d="M40 72 Q60 100 80 72 Q60 85 40 72"
          fill="#f1f5f9"
        />

        {/* Head */}
        <circle cx="60" cy="42" r="26" fill="#1e293b" />
        <circle cx="60" cy="40" r="22" fill="#0f172a" />

        {/* Face / cheeks */}
        <ellipse cx="48" cy="44" rx="6" ry="5" fill="#fef3c7" opacity="0.9" />
        <ellipse cx="72" cy="44" rx="6" ry="5" fill="#fef3c7" opacity="0.9" />

        {/* Eyes (with blink class) */}
        <g className="penguin-eyes">
          <ellipse cx="50" cy="40" rx="5" ry="6" fill="white" />
          <ellipse cx="70" cy="40" rx="5" ry="6" fill="white" />
          <circle cx="51" cy="40" r="2.5" fill="#0f172a" />
          <circle cx="71" cy="40" r="2.5" fill="#0f172a" />
        </g>
        <g className="penguin-blink" aria-hidden>
          <path d="M45 40 Q50 42 55 40" stroke="#0f172a" strokeWidth="2" fill="none" strokeLinecap="round" />
          <path d="M65 40 Q70 42 75 40" stroke="#0f172a" strokeWidth="2" fill="none" strokeLinecap="round" />
        </g>

        {/* Beak */}
        <path d="M58 48 L62 48 L60 54 Z" fill="#f59e0b" />
        <path d="M59 50 L61 50 L60 52 Z" fill="#fbbf24" />

        {/* Headphones */}
        <path
          d="M32 38 Q20 30 22 22 Q28 18 38 26 Q36 36 32 38"
          stroke="#334155"
          strokeWidth="4"
          fill="none"
          strokeLinecap="round"
        />
        <path
          d="M88 38 Q100 30 98 22 Q92 18 82 26 Q84 36 88 38"
          stroke="#334155"
          strokeWidth="4"
          fill="none"
          strokeLinecap="round"
        />
        <path d="M30 36 L90 36" stroke="#334155" strokeWidth="5" strokeLinecap="round" />
        <circle cx="60" cy="34" r="8" fill="#475569" stroke="#334155" strokeWidth="2" />
        <circle cx="60" cy="34" r="4" fill="#64748b" />

        {/* Flippers - right one waves on hover */}
        <ellipse className="penguin-flipper-left" cx="28" cy="78" rx="6" ry="18" fill="#1e293b" transform="rotate(-25 28 78)" />
        <ellipse className="penguin-flipper-right" cx="92" cy="78" rx="6" ry="18" fill="#1e293b" transform="rotate(25 92 78)" />

        {/* Feet */}
        <ellipse cx="44" cy="122" rx="12" ry="6" fill="#f59e0b" />
        <ellipse cx="76" cy="122" rx="12" ry="6" fill="#f59e0b" />
      </svg>
    </div>
  )
}
