// Horizontal bars with the spending per main category for the whole year or one month; a click opens that category.
import { useState } from 'react'
import {
  Bar,
  BarChart,
  Cell,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts'
import { formatMonthLabel } from '@shared/dates'
import { formatCents, formatCompactEuros } from '@shared/money'
import type { OverviewTable } from '@shared/overview'
import { ChartCard, type OpenChartTarget } from './ChartCard'
import { spendingByCategory, type SpendingEntry } from './chartData'
import { niceAxis } from './chartScale'
import { axisTick, gridStroke, seriesColors } from './chartStyle'
import { ChartTooltip } from './ChartTooltip'

export const spendingSectionId = 'chart-spending'
const rowHeight = 36
const minimumHeight = 140

type SpendingByCategoryChartProps = {
  overview: OverviewTable
  onOpen: OpenChartTarget
}

export function SpendingByCategoryChart({
  overview,
  onOpen
}: SpendingByCategoryChartProps): React.JSX.Element {
  const [period, setPeriod] = useState('year')
  const [includeSubcategories, setIncludeSubcategories] = useState(false)
  const activePeriod = period === 'year' || overview.months.includes(period) ? period : 'year'
  const entries = spendingByCategory(overview, activePeriod, includeSubcategories)

  const axis = niceAxis(0, entries[0]?.cents ?? 0)

  return (
    <ChartCard
      id={spendingSectionId}
      title="Uitgaven per categorie"
      subtitle="Transacties zonder categorie staan niet in deze grafiek. Klik op een balk om de transacties te bekijken."
      controls={
        <div className="chipRow">
          <label className="inlineLabel">
            Periode
            <select value={activePeriod} onChange={(event) => setPeriod(event.target.value)}>
              <option value="year">Heel jaar</option>
              {overview.months.map((month) => (
                <option key={month} value={month}>
                  {formatMonthLabel(month)}
                </option>
              ))}
            </select>
          </label>
          <label className="checkRow plain">
            <input
              type="checkbox"
              checked={includeSubcategories}
              onChange={(event) => setIncludeSubcategories(event.target.checked)}
            />
            Subcategorieën
          </label>
        </div>
      }
      table={{
        columns: ['Categorie', 'Uitgaven'],
        rows: entries.map((entry) => [entry.name, formatCents(entry.cents)])
      }}
    >
      {entries.length === 0 ? (
        <p className="muted">Geen uitgaven in deze periode.</p>
      ) : (
        <ResponsiveContainer
          width="100%"
          height={Math.max(minimumHeight, entries.length * rowHeight + 24)}
        >
          <BarChart
            data={entries}
            layout="vertical"
            margin={{ top: 4, right: 96, left: 0, bottom: 0 }}
          >
            <XAxis
              type="number"
              tickFormatter={formatCompactEuros}
              domain={axis.domain}
              ticks={axis.ticks}
              tick={axisTick}
              axisLine={{ stroke: gridStroke }}
              tickLine={false}
            />
            <YAxis
              type="category"
              dataKey="name"
              tick={axisTick}
              axisLine={false}
              tickLine={false}
              width={200}
            />
            <Tooltip
              cursor={{ fill: 'var(--surface-soft)' }}
              content={({ active, payload }) => (
                <ChartTooltip
                  active={active}
                  payload={payload}
                  title={(payload?.[0]?.payload as SpendingEntry | undefined)?.name}
                />
              )}
            />
            <Bar
              dataKey="cents"
              name="Uitgaven"
              fill={seriesColors[0]}
              barSize={18}
              radius={[0, 4, 4, 0]}
              isAnimationActive={false}
              cursor="pointer"
              onClick={(_, index) =>
                onOpen({
                  month: activePeriod === 'year' ? undefined : activePeriod,
                  categoryId: entries[index]?.categoryId
                })
              }
            >
              {entries.map((entry) => (
                <Cell key={entry.categoryId} fillOpacity={entry.depth === 0 ? 1 : 0.6} />
              ))}
              <LabelList
                dataKey="cents"
                position="right"
                formatter={(value) => formatCents(Number(value))}
                fill="var(--text)"
                fontSize={12}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </ChartCard>
  )
}
