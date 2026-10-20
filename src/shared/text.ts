// Lowercases text and strips accents so searches ignore case and diacritics.
export function normalizeText(text: string): string {
  return text.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase()
}
