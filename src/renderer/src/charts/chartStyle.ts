// Shared look of the chart axes and the series colors by fixed slot.
import { shortMonthName } from '@shared/dates'
import { formatCompactEuros } from '@shared/money'
import type { NiceAxis } from './chartScale'

export const seriesColors = [
  'var(--series-1)',
  'var(--series-2)',
  'var(--series-3)',
  'var(--series-4)',
  'var(--series-5)'
]

export const axisTick = { fill: 'var(--text-soft)', fontSize: 12 }
export const gridStroke = 'var(--border)'
export const surfaceRing = { stroke: 'var(--surface)', strokeWidth: 2 }
export const chartHeight = 300

// Horizontal axis with one tick per month, for points that have a `month` key.
export const monthAxisProps = {
  dataKey: 'month',
  tickFormatter: shortMonthName,
  tick: axisTick,
  axisLine: { stroke: gridStroke },
  tickLine: false
}

// Vertical axis with round euro amounts.
export function amountAxisProps(axis: NiceAxis): {
  tickFormatter: (cents: number) => string
  domain: [number, number]
  ticks: number[]
  tick: typeof axisTick
  axisLine: false
  tickLine: false
  width: number
} {
  return {
    tickFormatter: formatCompactEuros,
    domain: axis.domain,
    ticks: axis.ticks,
    tick: axisTick,
    axisLine: false,
    tickLine: false,
    width: 48
  }
}
