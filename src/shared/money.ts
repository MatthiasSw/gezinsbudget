// Converts between Belgian-formatted amount text and whole cents, without floating point math.
import { AppError } from '@shared/errors'

const amountPattern = /^([+-]?)(\d{1,3}(?:\.\d{3})+|\d+)(?:,(\d{1,2}))?$/
const nonBreakingSpace = ' '

export function parseAmountToCents(text: string): number {
  const match = amountPattern.exec(text.trim())
  if (!match) throw new AppError('IMPORT_PARSE_ERROR', `Invalid amount: "${text}"`)

  const [, sign, integerPart, fractionPart = ''] = match
  const wholeDigits = integerPart.replace(/\./g, '')
  const cents = parseInt(wholeDigits + fractionPart.padEnd(2, '0'), 10)
  if (!Number.isSafeInteger(cents)) {
    throw new AppError('IMPORT_PARSE_ERROR', `Amount is too large: "${text}"`)
  }
  return sign === '-' && cents !== 0 ? -cents : cents
}

export function formatCents(cents: number): string {
  const { sign, euros, rest } = splitCents(cents)
  return `${sign}${groupThousands(euros)},${rest}${nonBreakingSpace}€`
}

export function formatCentsPlain(cents: number): string {
  const { sign, euros, rest } = splitCents(cents)
  return `${sign}${euros},${rest}`
}

function splitCents(cents: number): { sign: string; euros: string; rest: string } {
  if (!Number.isSafeInteger(cents)) throw new Error(`Not a whole number of cents: ${cents}`)

  const absolute = Math.abs(cents)
  return {
    sign: cents < 0 ? '-' : '',
    euros: String(Math.floor(absolute / 100)),
    rest: String(absolute % 100).padStart(2, '0')
  }
}

function groupThousands(digits: string): string {
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
}

export function formatCompactEuros(cents: number): string {
  const euros = cents / 100
  const absolute = Math.abs(euros)
  if (absolute < 1000) return Math.round(euros).toString()
  const thousands = Math.round(euros / 100) / 10
  return `${thousands.toString().replace('.', ',')}K`
}
