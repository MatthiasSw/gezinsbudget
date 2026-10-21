// Grouped bars for income and expenses per month, with the net result as a line.
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts'
import { formatMonthLabel } from '@shared/dates'
import { formatCents } from '@shared/money'
import type { OverviewTable } from '@shared/overview'
import { ChartCard } from './ChartCard'
import { monthlyTotalsSeries } from './chartData'
import { niceAxis } from './chartScale'
import {
  amountAxisProps,
  chartHeight,
  gridStroke,
  monthAxisProps,
  seriesColors,
  surfaceRing
} from './chartStyle'
import { ChartTooltip } from './ChartTooltip'

type IncomeExpenseChartProps = {
  overview: OverviewTable
}

export const incomeExpenseSectionId = 'chart-income-expense'
const inkColor = 'var(--text)'

export function IncomeExpenseChart({ overview }: IncomeExpenseChartProps): React.JSX.Element {
  const points = monthlyTotalsSeries(overview)
  const axis = niceAxis(
    Math.min(...points.map((point) => point.netCents)),
    Math.max(...points.map((point) => Math.max(point.incomeCents, point.expenseCents)))
  )

  return (
    <ChartCard
      id={incomeExpenseSectionId}
      title="Inkomsten en uitgaven per maand"
      legend={[
        { label: 'Inkomsten', color: seriesColors[0], shape: 'bar' },
        { label: 'Uitgaven', color: seriesColors[1], shape: 'bar' },
        { label: 'Netto', color: inkColor, shape: 'line' }
      ]}
      table={{
        columns: ['Maand', 'Inkomsten', 'Uitgaven', 'Netto'],
        rows: points.map((point) => [
          point.label,
          formatCents(point.incomeCents),
          formatCents(point.expenseCents),
          formatCents(point.netCents)
        ])
      }}
    >
      <ResponsiveContainer width="100%" height={chartHeight}>
        <ComposedChart data={points} barGap={2} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid vertical={false} stroke={gridStroke} />
          <XAxis {...monthAxisProps} />
          <YAxis {...amountAxisProps(axis)} />
          <Tooltip
            cursor={{ fill: 'var(--surface-soft)' }}
            content={({ active, payload, label }) => (
              <ChartTooltip
                active={active}
                payload={payload}
                title={formatMonthLabel(String(label))}
              />
            )}
          />
          <Bar
            dataKey="incomeCents"
            name="Inkomsten"
            fill={seriesColors[0]}
            barSize={16}
            radius={[4, 4, 0, 0]}
            isAnimationActive={false}
          />
          <Bar
            dataKey="expenseCents"
            name="Uitgaven"
            fill={seriesColors[1]}
            barSize={16}
            radius={[4, 4, 0, 0]}
            isAnimationActive={false}
          />
          <Line
            dataKey="netCents"
            name="Netto"
            stroke={inkColor}
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            dot={{ r: 4, fill: inkColor, ...surfaceRing }}
            activeDot={{ r: 5, fill: inkColor, ...surfaceRing }}
            isAnimationActive={false}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </ChartCard>
  )
}
