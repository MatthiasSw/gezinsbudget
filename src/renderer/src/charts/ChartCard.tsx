// Frame around one chart: title, optional controls, legend, the plot and a table with the figures.
import { InfoTip } from '../components/InfoTip'
import { ChartLegend, type LegendItem } from './ChartLegend'
import { ChartTable, type ChartTableData } from './ChartTable'

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
