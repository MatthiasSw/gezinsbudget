// Legend that mirrors the marks: a swatch for bars, a short stroke for lines.
export type LegendItem = {
  label: string
  color: string
  shape: 'bar' | 'line'
}

type ChartLegendProps = {
  items: LegendItem[]
}

export function ChartLegend({ items }: ChartLegendProps): React.JSX.Element {
  return (
    <ul className="chartLegend">
      {items.map((item) => (
        <li key={item.label}>
          <span className={`legendKey ${item.shape}`} style={{ background: item.color }} />
          {item.label}
        </li>
      ))}
    </ul>
  )
}
