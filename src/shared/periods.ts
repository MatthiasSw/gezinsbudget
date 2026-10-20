// Turns period presets (this month, last year, ...) into inclusive ISO date ranges.
export type PeriodPreset = 'thisMonth' | 'lastMonth' | 'thisYear' | 'lastYear' | 'all'

export type DateRange = {
  from?: string
  to?: string
}

export function presetRange(preset: PeriodPreset, today: string): DateRange {
  const year = Number(today.slice(0, 4))
  const month = Number(today.slice(5, 7))

  switch (preset) {
    case 'thisMonth':
      return monthRange(year, month)
    case 'lastMonth':
      return month === 1 ? monthRange(year - 1, 12) : monthRange(year, month - 1)
    case 'thisYear':
      return yearRange(year)
    case 'lastYear':
      return yearRange(year - 1)
    case 'all':
      return {}
  }
}

export function todayAsIso(date: Date = new Date()): string {
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${date.getFullYear()}-${month}-${day}`
}

function monthRange(year: number, month: number): DateRange {
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate()
  const prefix = `${year}-${String(month).padStart(2, '0')}`
  return { from: `${prefix}-01`, to: `${prefix}-${String(lastDay).padStart(2, '0')}` }
}

function yearRange(year: number): DateRange {
  return { from: `${year}-01-01`, to: `${year}-12-31` }
}

export function monthKeyRange(key: string): DateRange {
  return monthRange(Number(key.slice(0, 4)), Number(key.slice(5, 7)))
}

export function yearRangeOf(year: number): DateRange {
  return yearRange(year)
}
