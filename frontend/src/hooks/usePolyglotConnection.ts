/**
 * usePolyglotConnection — WebSocket hook for Local Polyglot Friend (Gemini Live).
 * Connects to ws://localhost:8000/ws/translate (or configurable).
 * - Captures microphone via AudioContext, converts Float32 -> Int16 PCM, streams over WebSocket.
 * - Handles incoming: JSON for UI (phonetic_spelling, local_spelling, english_translation), binary for TTS audio.
 */
import { useCallback, useEffect, useRef, useState } from 'react';

const WS_URL = 'ws://localhost:8000/ws/translate';
const SAMPLE_RATE = 16000;

export type PolyglotContext = {
  destination?: string;
  target_region?: string;
  target_language?: string;
  occasion?: string;
  slang_level?: string;
  personality?: string;
  profession?: string;
  hobbies?: string;
};

export type TranslationUpdate = {
  phonetic_spelling?: string;
  local_spelling?: string;
  english_translation?: string;
  error?: string;
};

export type UsePolyglotConnectionOptions = {
  wsUrl?: string;
  onTranslation?: (update: TranslationUpdate) => void;
  onAudioChunk?: (pcmBytes: ArrayBuffer) => void;
  onStatus?: (status: 'disconnected' | 'connecting' | 'connected' | 'error') => void;
};

export function usePolyglotConnection(options: UsePolyglotConnectionOptions = {}) {
  const {
    wsUrl = WS_URL,
    onTranslation,
    onAudioChunk,
    onStatus,
  } = options;

  const [status, setStatus] = useState<'disconnected' | 'connecting' | 'connected' | 'error'>('disconnected');
  const [translation, setTranslation] = useState<TranslationUpdate | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const sendQueueRef = useRef<Int16Array[]>([]);
  const isSendingRef = useRef(false);

  const notifyStatus = useCallback((s: typeof status) => {
    setStatus(s);
    onStatus?.(s);
  }, [onStatus]);

  const notifyTranslation = useCallback((update: TranslationUpdate) => {
    setTranslation(update);
    onTranslation?.(update);
  }, [onTranslation]);

  const float32ToInt16PCM = useCallback((float32: Float32Array): ArrayBuffer => {
    const int16 = new Int16Array(float32.length);
    for (let i = 0; i < float32.length; i++) {
      const s = Math.max(-1, Math.min(1, float32[i]));
      int16[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
    }
    return int16.buffer;
  }, []);

  const connect = useCallback((context: PolyglotContext) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.close();
    }
    notifyStatus('connecting');
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      notifyStatus('connected');
      ws.send(JSON.stringify(context));
    };

    const playPCM = (buffer: ArrayBuffer, sampleRate = 24000) => {
      const int16 = new Int16Array(buffer);
      const float32 = new Float32Array(int16.length);
      for (let i = 0; i < int16.length; i++) {
        float32[i] = int16[i] / (int16[i] < 0 ? 0x8000 : 0x7fff);
      }
      const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const audioBuffer = ctx.createBuffer(1, float32.length, sampleRate);
      audioBuffer.getChannelData(0).set(float32);
      const source = ctx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(ctx.destination);
      source.start(0);
    };

    ws.onmessage = (event: MessageEvent) => {
      if (typeof event.data === 'string') {
        try {
          const update: TranslationUpdate = JSON.parse(event.data);
          notifyTranslation(update);
        } catch {
          // ignore non-JSON
        }
      } else if (event.data instanceof ArrayBuffer) {
        onAudioChunk?.(event.data);
        playPCM(event.data);
      } else if (event.data instanceof Blob) {
        event.data.arrayBuffer().then((buf) => {
          onAudioChunk?.(buf);
          playPCM(buf);
        });
      }
    };

    ws.onerror = () => notifyStatus('error');
    ws.onclose = () => {
      wsRef.current = null;
      if (status === 'connected') notifyStatus('disconnected');
    };
  }, [wsUrl, notifyStatus, notifyTranslation, onAudioChunk, status]);

  const disconnect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    if (processorRef.current && streamRef.current) {
      try {
        streamRef.current.getTracks().forEach((t) => t.stop());
      } catch {
        // ignore
      }
      streamRef.current = null;
      processorRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    notifyStatus('disconnected');
  }, [notifyStatus]);

  const startMicrophone = useCallback(async () => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;

    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    streamRef.current = stream;

    const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)({
      sampleRate: SAMPLE_RATE,
    });
    audioContextRef.current = ctx;

    const source = ctx.createMediaStreamSource(stream);
    const bufferSize = 4096;
    const processor = ctx.createScriptProcessor(bufferSize, 1, 1);
    processorRef.current = processor;

    processor.onaudioprocess = (e: AudioProcessingEvent) => {
      const input = e.inputBuffer.getChannelData(0);
      const pcm = float32ToInt16PCM(new Float32Array(input));
      const int16 = new Int16Array(pcm);
      sendQueueRef.current.push(int16);
      if (!isSendingRef.current) flushSendQueue();
    };

    source.connect(processor);
    processor.connect(ctx.destination);
  }, [float32ToInt16PCM]);

  const flushSendQueue = useCallback(() => {
    const ws = wsRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN || sendQueueRef.current.length === 0) {
      isSendingRef.current = false;
      return;
    }
    isSendingRef.current = true;
    const chunk = sendQueueRef.current.shift();
    if (chunk) {
      ws.send(chunk.buffer);
    }
    if (sendQueueRef.current.length > 0) {
      requestAnimationFrame(flushSendQueue);
    } else {
      isSendingRef.current = false;
    }
  }, []);

  const stopMicrophone = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }
    sendQueueRef.current = [];
    isSendingRef.current = false;
  }, []);

  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return {
    status,
    translation,
    connect,
    disconnect,
    startMicrophone,
    stopMicrophone,
  };
}
