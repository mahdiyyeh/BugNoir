/**
 * Map backend target_language name to BCP 47 code for speech recognition
 * (e.g. "Capture what the other person said" in the conversation step).
 */
export function targetLanguageToSpeechLocale(targetLanguage: string): string {
  const lower = targetLanguage.toLowerCase()
  if (lower.includes('french') || lower === 'fr') return 'fr-FR'
  if (lower.includes('arabic') || lower === 'ar') return 'ar-MA'
  if (lower.includes('english') || lower === 'en') return 'en-GB'
  return 'en-US'
}
