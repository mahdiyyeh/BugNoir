import { useState, useCallback, useRef } from 'react'

export type SpeakItem = { text: string; lang?: string }

export function useSpeechSynthesis() {
  const [speaking, setSpeaking] = useState(false)
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null)
  const sequenceQueueRef = useRef<SpeakItem[]>([])
  const sequenceIndexRef = useRef(0)

  const speak = useCallback((text: string, lang = 'en-US') => {
    if (!text.trim() || typeof window === 'undefined' || !window.speechSynthesis) return
    window.speechSynthesis.cancel()
    sequenceQueueRef.current = []
    const u = new SpeechSynthesisUtterance(text)
    u.lang = lang
    u.onstart = () => setSpeaking(true)
    u.onend = () => setSpeaking(false)
    u.onerror = () => setSpeaking(false)
    utteranceRef.current = u
    window.speechSynthesis.speak(u)
  }, [])

  /** Speaks a list of phrases in order; each starts only after the previous one ends. Does not cancel between items. */
  const speakSequence = useCallback((items: SpeakItem[]) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return
    const valid = items.filter((i) => i.text?.trim())
    if (valid.length === 0) return
    window.speechSynthesis.cancel()
    sequenceQueueRef.current = [...valid]
    sequenceIndexRef.current = 0

    const speakNext = () => {
      const idx = sequenceIndexRef.current
      if (idx >= sequenceQueueRef.current.length) {
        setSpeaking(false)
        return
      }
      const item = sequenceQueueRef.current[idx]
      const text = item.text?.trim()
      if (!text) {
        sequenceIndexRef.current = idx + 1
        speakNext()
        return
      }
      const u = new SpeechSynthesisUtterance(text)
      u.lang = item.lang ?? 'en-US'
      u.onstart = () => setSpeaking(true)
      u.onend = () => {
        sequenceIndexRef.current = idx + 1
        if (sequenceIndexRef.current >= sequenceQueueRef.current.length) {
          setSpeaking(false)
        } else {
          speakNext()
        }
      }
      u.onerror = () => {
        sequenceIndexRef.current = idx + 1
        if (sequenceIndexRef.current >= sequenceQueueRef.current.length) {
          setSpeaking(false)
        } else {
          speakNext()
        }
      }
      utteranceRef.current = u
      window.speechSynthesis.speak(u)
    }

    speakNext()
  }, [])

  return { speak, speakSequence, speaking }
}
