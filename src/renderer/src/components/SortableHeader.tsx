// Column header that sorts the table when clicked and shows the current direction.
import type { SortDirection } from '../transactionSort'

type SortableHeaderProps = {
  label: string
  active: boolean
  direction: SortDirection
  className?: string
  onClick: () => void
}

export function SortableHeader({
  label,
  active,
  direction,
  className,
  onClick
}: SortableHeaderProps): React.JSX.Element {
  const ariaSort = active ? (direction === 'asc' ? 'ascending' : 'descending') : 'none'

  return (
    <th className={className} aria-sort={ariaSort}>
      <button className="sortButton" onClick={onClick}>
        {label}
        <span className={active ? 'sortArrow active' : 'sortArrow'}>
          {active ? (direction === 'asc' ? '▲' : '▼') : '↕'}
        </span>
      </button>
    </th>
  )
}
