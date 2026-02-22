import { useState, useCallback, useRef } from 'react'
import type { OnboardingAnswers, SuggestedResponse } from './api/client'
import {
  submitOnboarding,
  markArrived,
  processTurn,
  confirmUserSaid,
  getDashboard,
} from './api/client'
import { VoiceInput, VoiceInputControlled, useVoiceInput } from './components/VoiceInput'
import { useSpeechSynthesis } from './hooks/useSpeechSynthesis'
import { targetLanguageToSpeechLocale } from './lib/speechLocale'

type Step =
  | 'location'
  | 'intro'
  | 'personality'
  | 'occasion'
  | 'pronunciation'
  | 'slang'
  | 'profession'
  | 'hobbies'
  | 'thanks'
  | 'welcome'
  | 'conversation'
  | 'ended'

const PERSONALITY_OPTIONS = ['Energetic', 'Charismatic', 'Sweet', 'Cool', 'Rude', 'Smart']
const OCCASION_OPTIONS = ['Holiday', 'Social', 'Professional', 'Business', 'Interview', 'Love']
const PRONUNCIATION_OPTIONS = ['Easy', 'Medium', 'Hard']
const SLANG_OPTIONS = ['Down with the kids', 'Friendly', 'Moderate', 'Minimal', 'None']
const LOCATIONS = [
  { id: 'paris' as const, label: 'Paris' },
  { id: 'london' as const, label: 'London' },
  { id: 'morocco' as const, label: 'Morocco' },
]

export default function App() {
  const [step, setStep] = useState<Step>('location')
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [region, setRegion] = useState<string>('')
  const [targetLanguage, setTargetLanguage] = useState<string>('')
  const [speechLocale, setSpeechLocale] = useState<string>('')
  const [answers, setAnswers] = useState<Partial<OnboardingAnswers>>({})
  const [error, setError] = useState<string | null>(null)

  // Conversation state (STEP Z)
  const [otherSaidEnglish, setOtherSaidEnglish] = useState<string>('')
  const [suggested, setSuggested] = useState<SuggestedResponse | null>(null)
  const [waitingForUserToSpeak, setWaitingForUserToSpeak] = useState(false)

  // Dashboard (value tracking)
  const [dashboard, setDashboard] = useState<{
    total_interactions: number;
    total_value_eur: number;
    average_complexity: number;
    log: Array<{ complexity_score: number; interaction_type: string; estimated_value_eur: number; timestamp: string }>;
  } | null>(null)

  const { speak, speaking } = useSpeechSynthesis()
  const conversationVoice = useVoiceInput(speechLocale ? { lang: speechLocale } : undefined)
  const processingRef = useRef(false)

  const selectLocation = useCallback(
    (loc: 'paris' | 'london' | 'morocco') => {
      setAnswers((a) => ({ ...a, location: loc }))
      setStep('intro')
    },
    []
  )

  const submitIntro = useCallback(() => setStep('personality'), [])

  const setAnswer = useCallback(<K extends keyof OnboardingAnswers>(key: K, value: OnboardingAnswers[K]) => {
    setAnswers((a) => ({ ...a, [key]: value }))
  }, [])

  const goNext = useCallback((next: Step) => setStep(next), [])

  const submitOnboardingFlow = useCallback(async () => {
    const a = answers as OnboardingAnswers
    if (!a.location || !a.personality || !a.occasion || !a.pronunciation_difficulty || !a.slang_level || !a.profession || !a.hobbies) {
      setError('Please complete all fields.')
      return
    }
    setError(null)
    try {
      const res = await submitOnboarding(a)
      setSessionId(res.session_id)
      setRegion(res.target_region)
      setTargetLanguage(res.target_language)
      setSpeechLocale(targetLanguageToSpeechLocale(res.target_language))
      setStep('thanks')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save.')
    }
  }, [answers])

  const handleArrive = useCallback(async () => {
    if (!sessionId) return
    setError(null)
    try {
      await markArrived(sessionId)
      setStep('welcome')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed.')
    }
  }, [sessionId])

  const startConversation = useCallback(() => setStep('conversation'), [])

  const handleOtherPersonInput = useCallback(
    async (text: string) => {
      if (!sessionId || !text.trim()) return
      if (processingRef.current) return
      processingRef.current = true
      setError(null)
      try {
        const res = await processTurn(sessionId, text.trim())
        setOtherSaidEnglish(res.other_person_said_english)
        setSuggested(res.suggested_response)
        setWaitingForUserToSpeak(true)
        speak(res.other_person_said_english, 'en-US')
        setTimeout(() => speak(res.suggested_response.local, speechLocale || 'en-US'), 800)
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Processing failed.')
      } finally {
        processingRef.current = false
      }
    },
    [sessionId, speak, speechLocale]
  )

  const handleUserSaidConfirm = useCallback(
    async (userSaid: string) => {
      if (!sessionId || !suggested) return
      try {
        const res = await confirmUserSaid(sessionId, userSaid, suggested.local)
        if (res.conversation_ended) {
          setStep('ended')
        } else {
          setOtherSaidEnglish('')
          setSuggested(null)
          setWaitingForUserToSpeak(false)
          conversationVoice.resetTranscript()
        }
      } catch {
        setOtherSaidEnglish('')
        setSuggested(null)
        setWaitingForUserToSpeak(false)
        conversationVoice.resetTranscript()
      }
    },
    [sessionId, suggested, conversationVoice]
  )

  const endConvo = useCallback(() => setStep('ended'), [])

  const startNewConvo = useCallback(() => {
    setSuggested(null)
    setOtherSaidEnglish('')
 setWaitingForUserToSpeak(false)
    setStep('conversation')
  }, [])

  const startNewUser = useCallback(() => {
    setStep('location')
    setSessionId(null)
    setRegion('')
    setTargetLanguage('')
    setSpeechLocale('')
    setAnswers({})
    setSuggested(null)
    setOtherSaidEnglish('')
    setDashboard(null)
  }, [])

  return (
    <div style={{ minHeight: '100vh', padding: 24, maxWidth: 480, margin: '0 auto' }}>
      {step === 'ended' && (
        <button type="button" className="btn-end-convo" style={{ display: 'none' }} aria-hidden />
      )}
      {step === 'conversation' && (
        <button type="button" className="btn-end-convo" onClick={endConvo}>
          End Convo
        </button>
      )}

      {error && (
        <p style={{ color: 'var(--red)', marginBottom: 16 }}>{error}</p>
      )}

      {/* ----- LOCATION ----- */}
      {step === 'location' && (
        <div className="glass" style={{ padding: 32, marginTop: 40 }}>
          <h1 style={{ fontFamily: 'var(--font-serif)', color: 'var(--rbt)', marginBottom: 24 }}>
            Where are you going?
          </h1>
          <p style={{ color: 'var(--rbt)', marginBottom: 24 }}>
            Choose your destination (voice or tap):
          </p>
          <div className="options-grid">
            {LOCATIONS.map((loc) => (
              <button
                key={loc.id}
                type="button"
                className="option-btn"
                onClick={() => selectLocation(loc.id)}
              >
                {loc.label}
              </button>
            ))}
          </div>
          <VoiceInput
            onResult={(text) => {
              const t = text.toLowerCase()
              if (t.includes('paris')) selectLocation('paris')
              else if (t.includes('london')) selectLocation('london')
              else if (t.includes('morocco')) selectLocation('morocco')
            }}
            placeholder="Or say: Paris, London, Morocco"
          />
        </div>
      )}

      {/* ----- INTRO ----- */}
      {step === 'intro' && (
        <div className="glass" style={{ padding: 32, marginTop: 40 }}>
          <p style={{ color: 'var(--rbt)', fontSize: '1.1rem', marginBottom: 24 }}>
            Wow, what a location! Now let me get to know a bit more about you.
          </p>
          <button type="button" className="btn-primary btn-chamfer" onClick={submitIntro}>
            Okay
          </button>
        </div>
      )}

      {/* ----- PERSONALITY ----- */}
      {step === 'personality' && (
        <div className="glass" style={{ padding: 32, marginTop: 40 }}>
          <h2 style={{ color: 'var(--rbt)', marginBottom: 16 }}>How do you want to come across?</h2>
          <div className="options-grid" style={{ marginBottom: 24 }}>
            {PERSONALITY_OPTIONS.map((opt) => (
              <button
                key={opt}
                type="button"
                className={`option-btn ${answers.personality === opt ? 'selected' : ''}`}
                onClick={() => { setAnswer('personality', opt); goNext('occasion') }}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ----- OCCASION ----- */}
      {step === 'occasion' && (
        <div className="glass" style={{ padding: 32, marginTop: 40 }}>
          <h2 style={{ color: 'var(--rbt)', marginBottom: 16 }}>What is the occasion of the trip?</h2>
          <div className="options-grid" style={{ marginBottom: 24 }}>
            {OCCASION_OPTIONS.map((opt) => (
              <button
                key={opt}
                type="button"
                className={`option-btn ${answers.occasion === opt ? 'selected' : ''}`}
                onClick={() => { setAnswer('occasion', opt); goNext('pronunciation') }}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ----- PRONUNCIATION ----- */}
      {step === 'pronunciation' && (
        <div className="glass" style={{ padding: 32, marginTop: 40 }}>
          <h2 style={{ color: 'var(--rbt)', marginBottom: 16 }}>
            How easy do you find it to pronounce {answers.location === 'morocco' ? 'Arabic' : 'French'} words?
          </h2>
          <div className="options-grid" style={{ marginBottom: 24 }}>
            {PRONUNCIATION_OPTIONS.map((opt) => (
              <button
                key={opt}
                type="button"
                className={`option-btn ${answers.pronunciation_difficulty === opt ? 'selected' : ''}`}
                onClick={() => { setAnswer('pronunciation_difficulty', opt); goNext('slang') }}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ----- SLANG ----- */}
      {step === 'slang' && (
        <div className="glass" style={{ padding: 32, marginTop: 40 }}>
          <h2 style={{ color: 'var(--rbt)', marginBottom: 16 }}>What level of slang do you want to use?</h2>
          <div className="options-grid" style={{ marginBottom: 24 }}>
            {SLANG_OPTIONS.map((opt) => (
              <button
                key={opt}
                type="button"
                className={`option-btn ${answers.slang_level === opt ? 'selected' : ''}`}
                onClick={() => { setAnswer('slang_level', opt); goNext('profession') }}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ----- PROFESSION ----- */}
      {step === 'profession' && (
        <div className="glass" style={{ padding: 32, marginTop: 40 }}>
          <h2 style={{ color: 'var(--rbt)', marginBottom: 16 }}>What is your profession?</h2>
          <VoiceInput
            onResult={(text) => setAnswer('profession', text)}
            placeholder="Say or type your profession"
          />
          <input
            type="text"
            placeholder="Or type here"
            value={answers.profession ?? ''}
            onChange={(e) => setAnswer('profession', e.target.value)}
            style={{
              width: '100%',
              marginTop: 12,
              padding: 12,
              borderRadius: 12,
              border: '1px solid var(--glass-border)',
              fontFamily: 'var(--font-serif)',
            }}
          />
          <button
            type="button"
            className="btn-primary"
            style={{ marginTop: 20 }}
            onClick={() => goNext('hobbies')}
          >
            Next
          </button>
        </div>
      )}

      {/* ----- HOBBIES ----- */}
      {step === 'hobbies' && (
        <div className="glass" style={{ padding: 32, marginTop: 40 }}>
          <h2 style={{ color: 'var(--rbt)', marginBottom: 16 }}>What are your hobbies?</h2>
          <VoiceInput
            onResult={(text) => setAnswer('hobbies', text)}
            placeholder="Say or type your hobbies"
          />
          <input
            type="text"
            placeholder="Or type here"
            value={answers.hobbies ?? ''}
            onChange={(e) => setAnswer('hobbies', e.target.value)}
            style={{
              width: '100%',
              marginTop: 12,
              padding: 12,
              borderRadius: 12,
              border: '1px solid var(--glass-border)',
              fontFamily: 'var(--font-serif)',
            }}
          />
          <button
            type="button"
            className="btn-primary"
            style={{ marginTop: 20 }}
            onClick={submitOnboardingFlow}
          >
            Next
          </button>
        </div>
      )}

      {/* ----- THANKS ----- */}
      {step === 'thanks' && (
        <div className="glass" style={{ padding: 32, marginTop: 40 }}>
          <p style={{ color: 'var(--rbt)', fontSize: '1.05rem', lineHeight: 1.6 }}>
            What an interesting individual! Thanks for all that info — I now have a better
            understanding of who you are and look forward to getting to know you more through
            the conversations you have with others.
          </p>
          <p style={{ color: 'var(--rbt)', marginTop: 24 }}>When you arrive at your destination, tap below.</p>
          <button type="button" className="btn-primary btn-chamfer" style={{ marginTop: 16 }} onClick={handleArrive}>
            I&apos;m here
          </button>
        </div>
      )}

      {/* ----- WELCOME ----- */}
      {step === 'welcome' && (
        <div className="glass" style={{ padding: 32, marginTop: 40 }}>
          <h1 style={{ color: 'var(--rbt)', marginBottom: 24 }}>Welcome to {region}</h1>
          <button type="button" className="btn-primary btn-chamfer" onClick={startConversation}>
            Start Convo
          </button>
        </div>
      )}

      {/* ----- CONVERSATION (STEP Z) ----- */}
      {step === 'conversation' && (
        <div style={{ paddingTop: 48 }}>
          <h2 style={{ color: 'var(--rbt)', marginBottom: 16 }}>Conversation</h2>
          <p style={{ color: 'var(--black)', marginBottom: 16 }}>
            Capture what the other person said (voice or text), then we&apos;ll suggest a response.
          </p>
          <VoiceInput
            onResult={handleOtherPersonInput}
            placeholder="Say or type what the other person said..."
            lang={targetLanguage ? targetLanguageToSpeechLocale(targetLanguage) : undefined}
          />
          <input
            type="text"
            placeholder="Or type what they said here"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                const v = (e.target as HTMLInputElement).value.trim()
                if (v) handleOtherPersonInput(v)
                ;(e.target as HTMLInputElement).value = ''
              }
            }}
            style={{
              width: '100%',
              marginTop: 12,
              padding: 12,
              borderRadius: 12,
              border: '1px solid var(--glass-border)',
              fontFamily: 'var(--font-serif)',
            }}
          />

          {otherSaidEnglish && (
            <div className="glass" style={{ marginTop: 24, padding: 20 }}>
              <p style={{ color: 'var(--black)', marginBottom: 8 }}>They said (in English):</p>
              <p style={{ color: 'var(--red)' }}>{otherSaidEnglish}</p>
            </div>
          )}

          {suggested && waitingForUserToSpeak && (
            <div className="glass" style={{ marginTop: 24, padding: 20 }}>
              <p style={{ color: 'var(--rbt)', marginBottom: 8 }}>Say this in local language:</p>
              <p className="text-rbt" style={{ marginBottom: 8 }}>{suggested.phonetic}</p>
              <p className="text-french" style={{ marginBottom: 8 }}>
                {suggested.local}
                <button type="button" className="option-btn" style={{ marginLeft: 8, padding: '4px 10px' }} onClick={() => speak(suggested!.local, speechLocale || 'en-US')}>🔊 Hear it</button>
              </p>
              <p className="text-english">{suggested.english}</p>
              <p style={{ marginTop: 16, color: 'var(--rbt)', fontSize: '0.95rem' }}>
                Repeat the phrase, or say &quot;next&quot; to get a new suggestion.
              </p>
              <VoiceInputControlled
                listening={conversationVoice.listening}
                transcript={conversationVoice.transcript}
                startListening={conversationVoice.startListening}
                stopListening={conversationVoice.stopListening}
                resetTranscript={conversationVoice.resetTranscript}
                onResult={(text) => {
                  if (text.toLowerCase().includes('next')) {
                    setWaitingForUserToSpeak(false)
                    setSuggested(null)
                    setOtherSaidEnglish('')
                    conversationVoice.resetTranscript()
                    return
                  }
                  handleUserSaidConfirm(text)
                }}
                placeholder="Speak your response..."
              />
            </div>
          )}

          {speaking && (
            <p style={{ color: 'var(--rbt)', marginTop: 16 }}>🔊 Playing...</p>
          )}
        </div>
      )}

      {/* ----- ENDED ----- */}
      {step === 'ended' && (
        <div className="glass" style={{ padding: 32, marginTop: 40 }}>
          <h2 style={{ color: 'var(--rbt)', marginBottom: 24 }}>Conversation ended</h2>
          <button type="button" className="btn-primary btn-chamfer" style={{ display: 'block', marginBottom: 16, width: '100%' }} onClick={startNewConvo}>
            Start Convo
          </button>
          <button type="button" className="option-btn" style={{ width: '100%', marginBottom: 16 }} onClick={async () => {
            try {
              const data = await getDashboard()
              setDashboard(data)
            } catch {
              setDashboard(null)
            }
          }}>
            Dashboard
          </button>
          {dashboard && (
            <div className="glass" style={{ padding: 20, marginTop: 16 }}>
              <p style={{ color: 'var(--rbt)', marginBottom: 8 }}>Total Interactions: <span style={{ color: 'var(--rbt)' }}>{dashboard.total_interactions}</span></p>
              <p style={{ color: 'var(--rbt)', marginBottom: 8 }}>Total Value: <span style={{ color: 'var(--red)' }}>€{dashboard.total_value_eur.toFixed(2)}</span></p>
              <p style={{ color: 'var(--rbt)' }}>Average Complexity Score: <span style={{ color: 'var(--rbt)' }}>{dashboard.average_complexity}</span></p>
            </div>
          )}
          <button type="button" className="option-btn" style={{ width: '100%' }} onClick={startNewUser}>
            New User
          </button>
        </div>
      )}

      {step !== 'location' && step !== 'conversation' && step !== 'ended' && (
        <p style={{ marginTop: 24, fontSize: '0.9rem', color: 'var(--rbt)' }}>
          Local — Your Mutual Polyglot Friend
        </p>
      )}
    </div>
  )
}
