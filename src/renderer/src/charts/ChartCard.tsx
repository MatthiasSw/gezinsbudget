// Frame around one chart: title, optional controls, legend, the plot and a table with the figures.
import { InfoTip } from '../components/InfoTip'
import { ChartLegend, type LegendItem } from './ChartLegend'
import { ChartTable, type ChartTableData } from './ChartTable'

// What a click on a chart opens: the transactions of a month (the whole year without one) and category.
export type ChartTarget = {
  month?: string
  categoryId?: string
}

export type OpenChartTarget = (target: ChartTarget) => void

type ChartCardProps = {
  id: string
  title: string
  subtitle?: string
  controls?: React.ReactNode
  legend?: LegendItem[]
  table: ChartTableData
  children: React.ReactNode
}

export function ChartCard({
  id,
  title,
  subtitle,
  controls,
  legend,
  table,
  children
}: ChartCardProps): React.JSX.Element {
  return (
    <section className="chartCard" id={id}>
      <h2>
        {title} {subtitle && <InfoTip text={subtitle} />}
      </h2>
      {controls}
      {legend && legend.length > 1 && <ChartLegend items={legend} />}
      {children}
      <ChartTable data={table} />
    </section>
  )
}
