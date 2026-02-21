import { describe, it, expect } from 'vitest'
import { targetLanguageToSpeechLocale } from './speechLocale'

describe('targetLanguageToSpeechLocale', () => {
  it('maps Paris/French to fr-FR', () => {
    expect(targetLanguageToSpeechLocale('French')).toBe('fr-FR')
    expect(targetLanguageToSpeechLocale('french')).toBe('fr-FR')
  })

  it('maps Morocco/Arabic to ar-MA', () => {
    expect(targetLanguageToSpeechLocale('Arabic')).toBe('ar-MA')
    expect(targetLanguageToSpeechLocale('arabic')).toBe('ar-MA')
  })

  it('maps English to en-GB', () => {
    expect(targetLanguageToSpeechLocale('English')).toBe('en-GB')
  })

  it('falls back to en-US for unknown', () => {
    expect(targetLanguageToSpeechLocale('')).toBe('en-US')
    expect(targetLanguageToSpeechLocale('Other')).toBe('en-US')
  })
})
