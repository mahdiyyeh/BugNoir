import { useState, useCallback, useRef } from 'react'
import type { OnboardingAnswers, SuggestedResponse } from './api/client'
import {
  submitOnboarding,
  markArrived,
  processTurn,
  confirmUserSaid,
  getDashboard,
  getValueSummary,
  getValueEvents,
} from './api/client'
import { VoiceInput, VoiceInputControlled, useVoiceInput } from './components/VoiceInput'
import { GradientOrb } from './components/GradientOrb'
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
  // Paid.ai billing (new value APIs)
  const [valueSummary, setValueSummary] = useState<{ total_events: number; total_cost_eur: number; average_complexity: number } | null>(null)
  const [valueEvents, setValueEvents] = useState<Array<{ complexity_score: number; estimated_cost_eur?: number; timestamp: string }>>([])

  const { speak, speakSequence, speaking } = useSpeechSynthesis()
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
        speakSequence([
          { text: res.other_person_said_english, lang: 'en-US' },
          { text: 'I would say this.', lang: 'en-US' },
          { text: res.suggested_response.local, lang: speechLocale || 'en-US' },
        ])
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Processing failed.')
      } finally {
        processingRef.current = false
      }
    },
    [sessionId, speakSequence, speechLocale]
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
    <div className="app-wrap" style={{ minHeight: '100vh', position: 'relative', overflow: 'hidden' }}>
      <GradientOrb color="blue" size="large" className="orb-top-right" />
      <GradientOrb color="purple" size="medium" className="orb-bottom-left" />

      <div style={{ position: 'relative', minHeight: '100vh', padding: 24, maxWidth: 440, margin: '0 auto', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        {step === 'ended' && (
          <button type="button" className="btn-end-convo" style={{ display: 'none' }} aria-hidden />
        )}
        {step === 'conversation' && (
          <button type="button" className="btn-end-convo" onClick={endConvo} aria-label="End conversation">
            End Convo
          </button>
        )}

        {error && (
          <p style={{ color: 'var(--red)', marginBottom: 16 }}>{error}</p>
        )}

        {/* ----- LOCATION ----- */}
        {step === 'location' && (
          <div className="glass" style={{ padding: 32 }}>
            <div style={{ textAlign: 'center', marginBottom: 32 }}>
              <div style={{
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 64, height: 64, borderRadius: 16,
                background: 'linear-gradient(135deg, #1A2BC3 0%, #000298 100%)', boxShadow: '0 12px 32px -4px rgba(26, 43, 195, 0.5)', marginBottom: 16,
              }}>
                <span style={{ fontSize: 32 }} aria-hidden>📍</span>
              </div>
              <h1 style={{ fontSize: '2.25rem', fontWeight: 700, color: 'var(--local-text-primary)', margin: '0 0 8px', letterSpacing: '-0.025em' }}>
                Local
              </h1>
              <p style={{ color: 'var(--local-text-secondary)', fontSize: '1rem', margin: 0 }}>
                Your AI language coach
              </p>
            </div>
            <h2 style={{ color: 'var(--local-text-primary)', fontSize: '1.5rem', fontWeight: 600, marginBottom: 8, textAlign: 'center' }}>
              Where are you going?
            </h2>
            <p style={{ color: 'var(--local-text-secondary)', fontSize: '0.875rem', marginBottom: 24, textAlign: 'center' }}>
              Choose your destination (voice or tap):
            </p>
            <div className="options-grid" style={{ marginBottom: 24 }}>
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
          <div className="glass" style={{ padding: 32 }}>
            <p style={{ color: 'var(--local-text-primary)', fontSize: '1.1rem', marginBottom: 24, lineHeight: 1.6 }}>
              Wow, what a location! Now let me get to know a bit more about you.
            </p>
            <button type="button" className="btn-primary btn-chamfer" style={{ width: '100%' }} onClick={submitIntro}>
              Okay
            </button>
          </div>
        )}

        {/* ----- PERSONALITY ----- */}
        {step === 'personality' && (
          <div className="glass" style={{ padding: 32 }}>
            <h2 style={{ color: 'var(--local-text-primary)', marginBottom: 8, textAlign: 'center', fontSize: '1.5rem', fontWeight: 600 }}>
              How do you want to come across?
            </h2>
            <p style={{ color: 'var(--local-text-secondary)', fontSize: '0.875rem', marginBottom: 24, textAlign: 'center' }}>
              Choose your style
            </p>
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
          <div className="glass" style={{ padding: 32 }}>
            <h2 style={{ color: 'var(--local-text-primary)', marginBottom: 8, textAlign: 'center', fontSize: '1.5rem', fontWeight: 600 }}>
              What is the occasion of the trip?
            </h2>
            <p style={{ color: 'var(--local-text-secondary)', fontSize: '0.875rem', marginBottom: 24, textAlign: 'center' }}>
              Select one
            </p>
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
          <div className="glass" style={{ padding: 32 }}>
            <h2 style={{ color: 'var(--local-text-primary)', marginBottom: 16, textAlign: 'center', fontSize: '1.125rem', fontWeight: 600 }}>
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
          <div className="glass" style={{ padding: 32 }}>
            <h2 style={{ color: 'var(--local-text-primary)', marginBottom: 16, textAlign: 'center', fontSize: '1.125rem', fontWeight: 600 }}>
              What level of slang do you want to use?
            </h2>
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
          <div className="glass" style={{ padding: 32 }}>
            <h2 style={{ color: 'var(--local-text-primary)', marginBottom: 16, fontSize: '1.25rem', fontWeight: 600 }}>
              What is your profession?
            </h2>
            <VoiceInput
              onResult={(text) => setAnswer('profession', text)}
              placeholder="Say or type your profession"
            />
            <input
              type="text"
              placeholder="Or type here"
              value={answers.profession ?? ''}
              onChange={(e) => setAnswer('profession', e.target.value)}
              className="input-glass"
            />
            <button
              type="button"
              className="btn-primary"
              style={{ marginTop: 20, width: '100%' }}
              onClick={() => goNext('hobbies')}
            >
              Next
            </button>
          </div>
        )}

        {/* ----- HOBBIES ----- */}
        {step === 'hobbies' && (
          <div className="glass" style={{ padding: 32 }}>
            <h2 style={{ color: 'var(--local-text-primary)', marginBottom: 16, fontSize: '1.25rem', fontWeight: 600 }}>
              What are your hobbies?
            </h2>
            <VoiceInput
              onResult={(text) => setAnswer('hobbies', text)}
              placeholder="Say or type your hobbies"
            />
            <input
              type="text"
              placeholder="Or type here"
              value={answers.hobbies ?? ''}
              onChange={(e) => setAnswer('hobbies', e.target.value)}
              className="input-glass"
            />
            <button
              type="button"
              className="btn-primary"
              style={{ marginTop: 20, width: '100%' }}
              onClick={submitOnboardingFlow}
            >
              Next
            </button>
          </div>
        )}

        {/* ----- THANKS ----- */}
        {step === 'thanks' && (
          <div className="glass" style={{ padding: 32 }}>
            <p style={{ color: 'var(--local-text-primary)', fontSize: '1.05rem', lineHeight: 1.6 }}>
              What an interesting individual! Thanks for all that info — I now have a better
              understanding of who you are and look forward to getting to know you more through
              the conversations you have with others.
            </p>
            <p style={{ color: 'var(--local-text-secondary)', marginTop: 24 }}>When you arrive at your destination, tap below.</p>
            <button type="button" className="btn-primary btn-chamfer" style={{ marginTop: 16, width: '100%' }} onClick={handleArrive}>
              I&apos;m here
            </button>
          </div>
        )}

        {/* ----- WELCOME ----- */}
        {step === 'welcome' && (
          <div className="glass" style={{ padding: 32 }}>
            <h1 style={{ color: 'var(--local-text-primary)', marginBottom: 24, fontSize: '1.5rem', fontWeight: 700 }}>
              Welcome to {region}
            </h1>
            <button type="button" className="btn-primary btn-chamfer" style={{ width: '100%' }} onClick={startConversation}>
              Start Convo
            </button>
          </div>
        )}

        {/* ----- CONVERSATION (STEP Z) ----- */}
        {step === 'conversation' && (
          <div style={{ paddingTop: 24, flex: 1, display: 'flex', flexDirection: 'column' }}>
            <h2 style={{ color: 'var(--local-text-primary)', marginBottom: 8, fontSize: '1.25rem', fontWeight: 600 }}>
              Conversation
            </h2>
            <p style={{ color: 'var(--local-text-secondary)', marginBottom: 16, fontSize: '0.875rem' }}>
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
              className="input-glass"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  const v = (e.target as HTMLInputElement).value.trim()
                  if (v) handleOtherPersonInput(v)
                  ;(e.target as HTMLInputElement).value = ''
                }
              }}
            />

            {otherSaidEnglish && (
              <div className="glass" style={{ marginTop: 24, padding: 20 }}>
                <p style={{ color: 'var(--local-text-muted)', fontSize: '0.75rem', fontWeight: 500, marginBottom: 4 }}>They said (in English)</p>
                <p style={{ color: 'var(--local-text-primary)', fontWeight: 600 }}>{otherSaidEnglish}</p>
              </div>
            )}

            {suggested && waitingForUserToSpeak && (
              <div className="glass phrase-card" style={{ marginTop: 24, padding: 24 }}>
                <div style={{ marginBottom: 16 }}>
                  <p style={{ color: 'var(--local-text-muted)', fontSize: '0.75rem', fontWeight: 500, marginBottom: 4 }}>Pronunciation</p>
                  <p className="text-rbt" style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>{suggested.phonetic}</p>
                </div>
                <div style={{ marginBottom: 16 }}>
                  <p style={{ color: 'var(--local-text-muted)', fontSize: '0.75rem', fontWeight: 500, marginBottom: 4 }}>Native Text</p>
                  <p className="text-french" style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>
                    {suggested.local}
                    <button type="button" className="option-btn" style={{ marginLeft: 8, padding: '6px 12px', fontSize: '0.875rem' }} onClick={() => speak(suggested!.local, speechLocale || 'en-US')}>🔊 Hear it</button>
                  </p>
                </div>
                <div style={{ marginBottom: 16 }}>
                  <p style={{ color: 'var(--local-text-muted)', fontSize: '0.75rem', fontWeight: 500, marginBottom: 4 }}>Translation</p>
                  <p className="text-english" style={{ margin: 0 }}>{suggested.english}</p>
                </div>
                <p style={{ marginTop: 16, color: 'var(--local-text-secondary)', fontSize: '0.875rem' }}>
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
              <p style={{ color: 'var(--local-primary)', marginTop: 16, fontSize: '0.875rem' }}>🔊 Playing...</p>
            )}
          </div>
        )}

        {/* ----- ENDED ----- */}
        {step === 'ended' && (
          <div className="glass" style={{ padding: 32 }}>
            <h2 style={{ color: 'var(--local-text-primary)', marginBottom: 24, fontSize: '1.25rem', fontWeight: 600 }}>
              Conversation ended
            </h2>
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
                <p style={{ color: 'var(--local-text-primary)', marginBottom: 8 }}>Total Interactions: <span style={{ color: 'var(--local-primary)' }}>{dashboard.total_interactions}</span></p>
                <p style={{ color: 'var(--local-text-primary)', marginBottom: 8 }}>Total Value: <span style={{ color: 'var(--red)' }}>€{dashboard.total_value_eur.toFixed(2)}</span></p>
                <p style={{ color: 'var(--local-text-primary)' }}>Average Complexity Score: <span style={{ color: 'var(--local-primary)' }}>{dashboard.average_complexity}</span></p>
              </div>
            )}
            <button type="button" className="option-btn" style={{ width: '100%', marginBottom: 16 }} onClick={async () => {
              try {
                const [summary, { events }] = await Promise.all([getValueSummary(), getValueEvents(5)])
                setValueSummary(summary)
                setValueEvents(events)
              } catch {
                setValueSummary(null)
                setValueEvents([])
              }
            }}>
              Billing summary (Paid.ai APIs)
            </button>
            {valueSummary !== null && (
              <div className="glass" style={{ padding: 20, marginTop: 16 }}>
                <p style={{ color: 'var(--local-text-primary)', marginBottom: 8 }}>Total events: <span style={{ color: 'var(--local-primary)' }}>{valueSummary.total_events}</span></p>
                <p style={{ color: 'var(--local-text-primary)', marginBottom: 8 }}>Total cost (€): <span style={{ color: 'var(--red)' }}>€{valueSummary.total_cost_eur.toFixed(2)}</span></p>
                <p style={{ color: 'var(--local-text-primary)', marginBottom: 8 }}>Average complexity: <span style={{ color: 'var(--local-primary)' }}>{valueSummary.average_complexity}</span></p>
                {valueEvents.length > 0 && (
                  <p style={{ color: 'var(--local-text-primary)', marginTop: 12, fontSize: '0.9rem' }}>Recent: {valueEvents.length} event(s) — complexity {valueEvents.map(e => e.complexity_score).join(', ')}</p>
                )}
              </div>
            )}
            <button type="button" className="option-btn" style={{ width: '100%' }} onClick={startNewUser}>
              New User
            </button>
          </div>
        )}

        {step !== 'location' && step !== 'conversation' && step !== 'ended' && (
          <p style={{ marginTop: 24, fontSize: '0.875rem', color: 'var(--local-text-muted)', textAlign: 'center' }}>
            Local — Your Mutual Polyglot Friend
          </p>
        )}
      </div>
    </div>
  )
}
