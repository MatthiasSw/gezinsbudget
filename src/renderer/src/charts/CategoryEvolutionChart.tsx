// Lines showing how the chosen categories develop month by month.
import { useState } from 'react'
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts'
import { categoryLabel } from '@shared/categoryIcons'
import { formatMonthLabel } from '@shared/dates'
import { formatCents } from '@shared/money'
import type { OverviewTable } from '@shared/overview'
import { SearchableSelect } from '../components/SearchableSelect'
import type { SearchOption } from '../optionFilter'
import { ChartCard } from './ChartCard'
import { categoryEvolution, spendingByCategory, type CategoryEvolutionPoint } from './chartData'
import { niceAxis } from './chartScale'
import {
  amountAxisProps,
  chartHeight,
  gridStroke,
  monthAxisProps,
  seriesColors,
  surfaceRing
} from './chartStyle'
import {
  addCategory,
  maxSelectedCategories,
  removeCategory,
  selectionOf,
  type SelectedCategory
} from './categorySelection'
import { ChartTooltip } from './ChartTooltip'

export const evolutionSectionId = 'chart-evolution'
const defaultCategoryCount = 3

type CategoryEvolutionChartProps = {
  overview: OverviewTable
}

function defaultSelection(overview: OverviewTable): SelectedCategory[] {
  const biggest = spendingByCategory(overview, 'year', false).slice(0, defaultCategoryCount)
  return selectionOf(biggest.map((entry) => entry.categoryId))
}

export function CategoryEvolutionChart({
  overview
}: CategoryEvolutionChartProps): React.JSX.Element {
  const [selection, setSelection] = useState(() => defaultSelection(overview))

  const namedRows = overview.rows.filter((row) => row.categoryId !== null)
  const nameOf = (categoryId: string): string =>
    categoryLabel(namedRows.find((row) => row.categoryId === categoryId) ?? { name: categoryId })
  const visible = selection.filter((item) =>
    namedRows.some((row) => row.categoryId === item.categoryId)
  )
  const points = categoryEvolution(
    overview,
    visible.map((item) => item.categoryId)
  )
  const axis = niceAxis(
    0,
    Math.max(0, ...points.flatMap((point) => Object.values(point.centsByCategory)))
  )
  const available = namedRows.filter(
    (row) => !selection.some((item) => item.categoryId === row.categoryId)
  )
  const isFull = selection.length >= maxSelectedCategories
  const options: SearchOption[] = available.map((row) => ({
    id: row.categoryId!,
    label: categoryLabel(row),
    name: row.name,
    hint: row.parentId
      ? namedRows.find((parent) => parent.categoryId === row.parentId)?.name
      : undefined
  }))

  return (
    <ChartCard
      id={evolutionSectionId}
      title="Evolutie per categorie"
      subtitle="Bedragen per maand, zonder teken. Een hoofdcategorie telt haar subcategorieën mee."
      controls={
        <div className="chipRow">
          {visible.map((item) => (
            <span key={item.categoryId} className="selectedChip">
              <span className="legendKey line" style={{ background: seriesColors[item.slot] }} />
              {nameOf(item.categoryId)}
              <button
                className="chipRemove"
                aria-label={`${nameOf(item.categoryId)} verwijderen`}
                onClick={() => setSelection(removeCategory(selection, item.categoryId))}
              >
                ×
              </button>
            </span>
          ))}
          <SearchableSelect
            options={options}
            disabled={isFull}
            placeholder={
              isFull ? `Maximaal ${maxSelectedCategories} categorieën` : 'Categorie toevoegen…'
            }
            onPick={(categoryId) => setSelection(addCategory(selection, categoryId))}
          />
        </div>
      }
      table={{
        columns: ['Maand', ...visible.map((item) => nameOf(item.categoryId))],
        rows: points.map((point) => [
          point.label,
          ...visible.map((item) => formatCents(point.centsByCategory[item.categoryId] ?? 0))
        ])
      }}
    >
      {visible.length === 0 ? (
        <p className="muted">Kies een categorie om de evolutie te zien.</p>
      ) : (
        <ResponsiveContainer width="100%" height={chartHeight}>
          <LineChart data={points} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid vertical={false} stroke={gridStroke} />
            <XAxis {...monthAxisProps} />
            <YAxis {...amountAxisProps(axis)} />
            <Tooltip
              cursor={{ stroke: 'var(--text-soft)', strokeWidth: 1 }}
              content={({ active, payload, label }) => (
                <ChartTooltip
                  active={active}
                  payload={payload}
                  title={formatMonthLabel(String(label))}
                />
              )}
            />
            {visible.map((item) => (
              <Line
                key={item.categoryId}
                dataKey={(point: CategoryEvolutionPoint) => point.centsByCategory[item.categoryId]}
                name={nameOf(item.categoryId)}
                stroke={seriesColors[item.slot]}
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
                dot={{ r: 4, fill: seriesColors[item.slot], ...surfaceRing }}
                activeDot={{ r: 5, fill: seriesColors[item.slot], ...surfaceRing }}
                isAnimationActive={false}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      )}
    </ChartCard>
  )
}
