// Keeps which rows of a list are selected; only rows that are still in the list count as selected.
import { useState } from 'react'

type Identifiable = { id: string }

export type Selection<T extends Identifiable> = {
  selectedIds: ReadonlySet<string>
  selectedRows: T[]
  toggle: (id: string) => void
  toggleAll: (shown: T[]) => void
  selectAll: () => void
  clear: () => void
}

export function useSelection<T extends Identifiable>(rows: T[]): Selection<T> {
  const [selectedIds, setSelectedIds] = useState<ReadonlySet<string>>(new Set())
  const selectedRows = rows.filter((row) => selectedIds.has(row.id))

  const toggle = (id: string): void => {
    const next = new Set(selectedIds)
    if (!next.delete(id)) next.add(id)
    setSelectedIds(next)
  }

  // Selects every shown row, or deselects them when they were all selected already.
  const toggleAll = (shown: T[]): void => {
    const allSelected = shown.length > 0 && shown.every((row) => selectedIds.has(row.id))
    const next = new Set(selectedIds)
    for (const row of shown) {
      if (allSelected) next.delete(row.id)
      else next.add(row.id)
    }
    setSelectedIds(next)
  }

  return {
    selectedIds,
    selectedRows,
    toggle,
    toggleAll,
    selectAll: () => setSelectedIds(new Set(rows.map((row) => row.id))),
    clear: () => setSelectedIds(new Set())
  }
}
