// Turns period presets (this month, last year, ...), months and years into inclusive ISO date ranges.
import { lastDayOfMonth, monthKey } from './dates'

export type PeriodPreset = 'thisMonth' | 'lastMonth' | 'thisYear' | 'lastYear' | 'all'

export type DateSpan = {
  from: string
  to: string
}

export type DateRange = Partial<DateSpan>

export function presetRange(preset: PeriodPreset, today: string): DateRange {
  const year = Number(today.slice(0, 4))

  switch (preset) {
    case 'thisMonth':
      return monthSpan(monthKey(today))
    case 'lastMonth':
      return monthSpan(previousMonthKey(today))
    case 'thisYear':
      return yearSpan(year)
    case 'lastYear':
      return yearSpan(year - 1)
    case 'all':
      return {}
  }
}

export function todayAsIso(date: Date = new Date()): string {
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${date.getFullYear()}-${month}-${day}`
}

export function monthSpan(key: string): DateSpan {
  return { from: `${key}-01`, to: lastDayOfMonth(key) }
}

export function yearSpan(year: number): DateSpan {
  return { from: `${year}-01-01`, to: `${year}-12-31` }
}

function previousMonthKey(isoDate: string): string {
  const year = Number(isoDate.slice(0, 4))
  const month = Number(isoDate.slice(5, 7))
  if (month === 1) return `${year - 1}-12`
  return `${year}-${String(month - 1).padStart(2, '0')}`
}
