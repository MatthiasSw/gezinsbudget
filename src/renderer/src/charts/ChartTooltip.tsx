// Tooltip content: the value leads, the series name follows, each keyed by a short stroke.
import { formatCents } from '@shared/money'

type TooltipEntry = {
  name?: string | number
  value?: number | string | ReadonlyArray<number | string>
  color?: string
}

type ChartTooltipProps = {
  active?: boolean
  title?: string
  payload?: ReadonlyArray<TooltipEntry>
}

export function ChartTooltip({
  active,
  title,
  payload
}: ChartTooltipProps): React.JSX.Element | null {
  if (!active || !payload || payload.length === 0) return null

  return (
    <div className="chartTooltip">
      {title && <strong className="tooltipTitle">{title}</strong>}
      {payload.map((entry) => (
        <div key={String(entry.name)} className="tooltipRow">
          <span className="legendKey line" style={{ background: entry.color }} />
          <strong>{formatCents(Number(entry.value))}</strong>
          <span className="muted">{entry.name}</span>
        </div>
      ))}
    </div>
  )
}
