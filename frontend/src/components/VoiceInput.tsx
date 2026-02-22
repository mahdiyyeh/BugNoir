import { useState, useCallback, useRef, useEffect } from 'react'

function getSpeechRecognition(): SpeechRecognitionConstructor | undefined {
  if (typeof window === 'undefined') return undefined
  return (window as unknown as { SpeechRecognition?: SpeechRecognitionConstructor; webkitSpeechRecognition?: SpeechRecognitionConstructor }).SpeechRecognition
    || (window as unknown as { webkitSpeechRecognition?: SpeechRecognitionConstructor }).webkitSpeechRecognition
}

export type VoiceInputOptions = { lang?: string }

export function useVoiceInput(options?: VoiceInputOptions) {
  const lang = options?.lang ?? 'en-US'
  const [listening, setListening] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [error, setError] = useState<string | null>(null)
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null)
  const hasRetriedWithEnUsRef = useRef(false)

  const startListening = useCallback(() => {
    setError(null)
    hasRetriedWithEnUsRef.current = false
    const SR = getSpeechRecognition()
    if (!SR) {
      setError('Voice input is not supported in this browser. Try Chrome or Edge, or use the text field below.')
      return
    }
    if (recognitionRef.current) {
      try { recognitionRef.current.stop() } catch { /* ignore */ }
      recognitionRef.current = null
    }

    const tryStart = (effectiveLang: string) => {
      const recognition = new (SR as SpeechRecognitionConstructor)()
      recognition.continuous = true
      recognition.interimResults = true
      recognition.lang = effectiveLang
      recognition.onresult = (e: SpeechRecognitionEvent) => {
        const last = e.results.length - 1
        const text = e.results[last][0].transcript
        setTranscript(text)
      }
      recognition.onerror = (e: SpeechRecognitionErrorEvent) => {
        const code = e.error ?? 'unknown'
        if (code === 'not-allowed') {
          setError('Microphone access was denied. Allow mic in your browser settings and try again.')
        } else if (code === 'no-speech') {
          setError('No speech heard. Tap Voice again and speak clearly.')
        } else if (code !== 'aborted') {
          if (effectiveLang !== 'en-US' && !hasRetriedWithEnUsRef.current) {
            hasRetriedWithEnUsRef.current = true
            if (recognitionRef.current) {
              try { recognitionRef.current.stop() } catch { /* ignore */ }
              recognitionRef.current = null
            }
            tryStart('en-US')
            return
          }
          setError('Voice input failed. Use the text field below or try again.')
        }
        setListening(false)
      }
      recognition.onend = () => setListening(false)
      recognitionRef.current = recognition
      try {
        recognition.start()
        setListening(true)
      } catch {
        setError('Could not start microphone. Check permissions or use the text field below.')
        setListening(false)
        recognitionRef.current = null
      }
    }

    tryStart(lang)
  }, [lang])

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      try { recognitionRef.current.stop() } catch { /* ignore */ }
      recognitionRef.current = null
    }
    setListening(false)
  }, [])

  const resetTranscript = useCallback(() => setTranscript(''), [])

  useEffect(() => () => {
    if (recognitionRef.current) {
      try { recognitionRef.current.stop() } catch { /* ignore */ }
    }
  }, [])

  return { listening, transcript, error, startListening, stopListening, resetTranscript }
}

type Props = {
  onResult: (text: string) => void
  placeholder?: string
  /** BCP 47 language code for speech recognition (e.g. fr-FR for French). If not set, defaults to en-US. */
  lang?: string
}

/** Controlled variant: parent provides state and callbacks from useVoiceInput (fixes dual-instance conflict in conversation step). */
export type VoiceInputControlledProps = {
  listening: boolean
  transcript: string
  error?: string | null
  startListening: () => void
  stopListening: () => void
  resetTranscript: () => void
  onResult: (text: string) => void
  placeholder?: string
}

export function VoiceInputControlled({
  listening,
  transcript,
  error: errorProp,
  startListening,
  stopListening,
  resetTranscript,
  onResult,
  placeholder = 'Say something...',
}: VoiceInputControlledProps) {
  const submittedRef = useRef(false)
  const handleSubmit = useCallback(() => {
    const t = (transcript || '').trim()
    if (t && !submittedRef.current) {
      submittedRef.current = true
      onResult(t)
      resetTranscript()
      stopListening()
    }
  }, [transcript, onResult, resetTranscript, stopListening])
  useEffect(() => {
    submittedRef.current = false
  }, [listening])
  return (
    <div style={{ marginTop: 8 }}>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <button
          type="button"
          className={listening ? 'option-btn selected' : 'option-btn'}
          onClick={() => (listening ? stopListening() : startListening())}
        >
          {listening ? '🛑 Stop' : '🎤 Voice'}
        </button>
        {listening && (
          <button type="button" className="btn-primary" onClick={handleSubmit}>
            Submit
          </button>
        )}
      </div>
      {errorProp && (
        <p style={{ marginTop: 8, color: 'var(--red)', fontSize: '0.875rem' }} role="alert">
          {errorProp}
        </p>
      )}
      {transcript && (
        <p style={{ marginTop: 8, color: 'var(--black)', fontSize: '0.95rem' }}>
          Heard: {transcript}
        </p>
      )}
      {placeholder && !listening && !errorProp && (
        <p style={{ marginTop: 6, color: 'var(--rbt)', opacity: 0.8, fontSize: '0.9rem' }}>
          {placeholder}
        </p>
      )}
    </div>
  )
}

export function VoiceInput({ onResult, placeholder = 'Say something...', lang }: Props) {
  const { listening, transcript, error, startListening, stopListening, resetTranscript } = useVoiceInput(lang ? { lang } : undefined)
  const submittedRef = useRef(false)

  const handleSubmit = useCallback(() => {
    const t = (transcript || '').trim()
    if (t && !submittedRef.current) {
      submittedRef.current = true
      onResult(t)
      resetTranscript()
      stopListening()
    }
  }, [transcript, onResult, resetTranscript, stopListening])

  useEffect(() => {
    submittedRef.current = false
  }, [listening])

  return (
    <div style={{ marginTop: 8 }} data-voice-lang={lang ?? undefined}>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <button
          type="button"
          className={listening ? 'option-btn selected' : 'option-btn'}
          onClick={() => (listening ? stopListening() : startListening())}
        >
          {listening ? '🛑 Stop' : '🎤 Voice'}
        </button>
        {listening && (
          <button type="button" className="btn-primary" onClick={handleSubmit}>
            Submit
          </button>
        )}
      </div>
      {error && (
        <p style={{ marginTop: 8, color: 'var(--red)', fontSize: '0.875rem' }} role="alert">
          {error}
        </p>
      )}
      {transcript && (
        <p style={{ marginTop: 8, color: 'var(--black)', fontSize: '0.95rem' }}>
          Heard: {transcript}
        </p>
      )}
      {placeholder && !listening && !error && (
        <p style={{ marginTop: 6, color: 'var(--rbt)', opacity: 0.8, fontSize: '0.9rem' }}>
          {placeholder}
        </p>
      )}
    </div>
  )
}
