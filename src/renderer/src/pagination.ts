// Splits a long list into pages.
export const pageSizeOptions = [25, 50, 100, 250]
export const defaultPageSize = 50

export function pageCount(total: number, pageSize: number): number {
  return Math.max(1, Math.ceil(total / pageSize))
}

export function clampPage(page: number, total: number, pageSize: number): number {
  return Math.min(Math.max(page, 0), pageCount(total, pageSize) - 1)
}

export function pageSlice<T>(items: T[], page: number, pageSize: number): T[] {
  const start = clampPage(page, items.length, pageSize) * pageSize
  return items.slice(start, start + pageSize)
}

export function pageRange(
  page: number,
  total: number,
  pageSize: number
): { first: number; last: number } {
  if (total === 0) return { first: 0, last: 0 }
  const start = clampPage(page, total, pageSize) * pageSize
  return { first: start + 1, last: Math.min(start + pageSize, total) }
}
