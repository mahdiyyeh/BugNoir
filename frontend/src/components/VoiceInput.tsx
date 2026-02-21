import React, { useState, useRef } from "react";

export interface VoiceInputProps {
  onRecordingComplete: (audioBase64: string) => void;
  disabled?: boolean;
}

/**
 * Record audio from mic and return base64 for POST /interact.
 * Uses MediaRecorder; fallback: no recording, demo uses mock.
 */
export function VoiceInput({ onRecordingComplete, disabled }: VoiceInputProps) {
  const [recording, setRecording] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);

  const startRecording = async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64 = (reader.result as string).split(",")[1];
          if (base64) onRecordingComplete(base64);
        };
        reader.readAsDataURL(blob);
      };
      recorder.start();
      mediaRecorderRef.current = recorder;
      setRecording(true);
    } catch (e) {
      setError("Microphone access denied or unavailable.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current = null;
      setRecording(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-2">
      {recording ? (
        <button
          type="button"
          onClick={stopRecording}
          disabled={disabled}
          className="rounded-full bg-red-600 px-6 py-3 font-medium text-white hover:bg-red-500 disabled:opacity-50"
        >
          Stop recording
        </button>
      ) : (
        <button
          type="button"
          onClick={startRecording}
          disabled={disabled}
          className="rounded-full bg-amber-600 px-6 py-3 font-medium text-white hover:bg-amber-500 disabled:opacity-50"
        >
          Hold to ask (or tap to start)
        </button>
      )}
      {error && <p className="text-sm text-red-400">{error}</p>}
    </div>
  );
}
