// Normalizes, validates and formats IBAN text so it can be compared and shown reliably.
export function normalizeIban(iban: string | undefined): string {
  return (iban ?? '').replace(/\s+/g, '').toUpperCase()
}

const ibanShape = /^[A-Z]{2}\d{2}[A-Z0-9]{11,30}$/

export function isValidIban(iban: string): boolean {
  const normalized = normalizeIban(iban)
  if (!ibanShape.test(normalized)) return false
  const rearranged = normalized.slice(4) + normalized.slice(0, 4)
  return mod97(toDigits(rearranged)) === 1
}

export function formatIban(iban: string): string {
  return normalizeIban(iban).replace(/(.{4})(?=.)/g, '$1 ')
}

function toDigits(text: string): string {
  return [...text].map((character) => parseInt(character, 36).toString()).join('')
}

function mod97(digits: string): number {
  return [...digits].reduce((remainder, digit) => (remainder * 10 + Number(digit)) % 97, 0)
}
