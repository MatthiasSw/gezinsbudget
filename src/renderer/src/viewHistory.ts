// The pages the user has visited, so the back button can return to the previous one.
import type { Filters } from './filters'

const maxPreviousViews = 50

export type View<PageId extends string> = {
  // Changes with every visit, so a page shown again starts fresh instead of keeping its old state.
  id: number
  page: PageId
  // Filters a click-through sets on the transactions page.
  filters?: Filters
}

export type ViewHistory<PageId extends string> = {
  current: View<PageId>
  previous: View<PageId>[]
  nextId: number
}

export function startHistory<PageId extends string>(page: PageId): ViewHistory<PageId> {
  return { current: { id: 0, page }, previous: [], nextId: 1 }
}

// Opening the page that is already shown, without new filters, changes nothing.
export function openView<PageId extends string>(
  history: ViewHistory<PageId>,
  page: PageId,
  filters?: Filters
): ViewHistory<PageId> {
  if (page === history.current.page && !filters && !history.current.filters) return history
  return {
    current: { id: history.nextId, page, filters },
    previous: [...history.previous, history.current].slice(-maxPreviousViews),
    nextId: history.nextId + 1
  }
}

export function canGoBack<PageId extends string>(history: ViewHistory<PageId>): boolean {
  return history.previous.length > 0
}

export function goBack<PageId extends string>(history: ViewHistory<PageId>): ViewHistory<PageId> {
  const previous = history.previous[history.previous.length - 1]
  if (!previous) return history
  return {
    ...history,
    current: previous,
    previous: history.previous.slice(0, -1)
  }
}
