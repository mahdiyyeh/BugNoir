import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { VoiceInput } from './VoiceInput'

describe('VoiceInput', () => {
  it('renders with default (no lang) and does not set data-voice-lang', () => {
    const onResult = () => {}
    const { container } = render(<VoiceInput onResult={onResult} />)
    const wrapper = container.querySelector('[data-voice-lang]')
    // When lang is not passed, we pass undefined so data-voice-lang may be undefined (not in DOM)
    expect(wrapper?.getAttribute('data-voice-lang')).toBeFalsy()
  })

  it('sets data-voice-lang when lang is fr-FR (conversation step with Paris)', () => {
    const onResult = () => {}
    const { container } = render(
      <VoiceInput onResult={onResult} placeholder="Say what they said..." lang="fr-FR" />
    )
    const wrapper = container.querySelector('[data-voice-lang]')
    expect(wrapper).toBeTruthy()
    expect(wrapper?.getAttribute('data-voice-lang')).toBe('fr-FR')
  })

  it('sets data-voice-lang when lang is ar-MA (Morocco)', () => {
    const onResult = () => {}
    const { container } = render(
      <VoiceInput onResult={onResult} lang="ar-MA" />
    )
    const wrapper = container.querySelector('[data-voice-lang]')
    expect(wrapper?.getAttribute('data-voice-lang')).toBe('ar-MA')
  })
})
