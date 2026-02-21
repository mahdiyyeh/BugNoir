import { useState, useCallback, useRef, useEffect } from 'react'

function getSpeechRecognition(): SpeechRecognitionConstructor | undefined {
  if (typeof window === 'undefined') return undefined
  return (window as unknown as { SpeechRecognition?: SpeechRecognitionConstructor; webkitSpeechRecognition?: SpeechRecognitionConstructor }).SpeechRecognition
    || (window as unknown as { webkitSpeechRecognition?: SpeechRecognitionConstructor }).webkitSpeechRecognition
}

export function useVoiceInput() {
  const [listening, setListening] = useState(false)
  const [transcript, setTranscript] = useState('')
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null)

  const startListening = useCallback(() => {
    const SR = getSpeechRecognition()
    if (!SR) {
      console.warn('Speech Recognition not supported')
      return
    }
    if (recognitionRef.current) {
      try { recognitionRef.current.stop() } catch { /* ignore */ }
    }
    const recognition = new (SR as SpeechRecognitionConstructor)()
    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = 'en-US'
    recognition.onresult = (e: SpeechRecognitionEvent) => {
      const last = e.results.length - 1
      const text = e.results[last][0].transcript
      setTranscript(text)
    }
    recognition.onerror = () => setListening(false)
    recognition.onend = () => setListening(false)
    recognitionRef.current = recognition
    recognition.start()
    setListening(true)
  }, [])

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

  return { listening, transcript, startListening, stopListening, resetTranscript }
}

type Props = {
  onResult: (text: string) => void
  placeholder?: string
}

export function VoiceInput({ onResult, placeholder = 'Say something...' }: Props) {
  const { listening, transcript, startListening, stopListening, resetTranscript } = useVoiceInput()
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
      {transcript && (
        <p style={{ marginTop: 8, color: 'var(--black)', fontSize: '0.95rem' }}>
          Heard: {transcript}
        </p>
      )}
      {placeholder && !listening && (
        <p style={{ marginTop: 6, color: 'var(--rbt)', opacity: 0.8, fontSize: '0.9rem' }}>
          {placeholder}
        </p>
      )}
    </div>
  )
}
