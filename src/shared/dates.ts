// Parses Belgian dates (dd/mm/yyyy) into ISO dates and derives month keys.
import { AppError } from '@shared/errors'

const belgianDatePattern = /^(\d{2})\/(\d{2})\/(\d{4})$/
const isoDatePattern = /^(\d{4})-(\d{2})-(\d{2})$/

export function parseBelgianDate(text: string): string {
  const match = belgianDatePattern.exec(text.trim())
  if (!match) throw new AppError('IMPORT_PARSE_ERROR', `Invalid date: "${text}"`)

  const [, day, month, year] = match
  const isoDate = `${year}-${month}-${day}`
  if (!isValidIsoDate(isoDate)) throw new AppError('IMPORT_PARSE_ERROR', `Invalid date: "${text}"`)
  return isoDate
}

export function isValidIsoDate(text: string): boolean {
  const match = isoDatePattern.exec(text)
  if (!match) return false

  const [, year, month, day] = match.map(Number)
  const date = new Date(Date.UTC(year, month - 1, day))
  return (
    date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day
  )
}

export function monthKey(isoDate: string): string {
  return isoDate.slice(0, 7)
}

export function formatBelgianDate(isoDate: string): string {
  const [year, month, day] = isoDate.split('-')
  return `${day}/${month}/${year}`
}

const shortMonthNames = [
  'jan',
  'feb',
  'mrt',
  'apr',
  'mei',
  'jun',
  'jul',
  'aug',
  'sep',
  'okt',
  'nov',
  'dec'
]

export function shortMonthName(key: string): string {
  return shortMonthNames[Number(key.slice(5, 7)) - 1]
}

export function formatMonthLabel(key: string): string {
  return `${shortMonthName(key)} ${key.slice(0, 4)}`
}

export function shiftYear(isoDate: string, years: number): string {
  const year = Number(isoDate.slice(0, 4)) + years
  const shifted = `${String(year).padStart(4, '0')}${isoDate.slice(4)}`
  return isValidIsoDate(shifted) ? shifted : `${shifted.slice(0, 8)}28`
}

export function lastDayOfMonth(key: string): string {
  const day = new Date(Date.UTC(Number(key.slice(0, 4)), Number(key.slice(5, 7)), 0)).getUTCDate()
  return `${key}-${String(day).padStart(2, '0')}`
}

export function monthKeysBetween(fromDate: string, toDate: string): string[] {
  const keys: string[] = []
  const startYear = Number(fromDate.slice(0, 4))
  const startMonth = Number(fromDate.slice(5, 7))
  const lastKey = monthKey(toDate)

  for (let index = 0; ; index++) {
    const year = startYear + Math.floor((startMonth - 1 + index) / 12)
    const month = ((startMonth - 1 + index) % 12) + 1
    const key = `${year}-${String(month).padStart(2, '0')}`
    if (key > lastKey) return keys
    keys.push(key)
  }
}
