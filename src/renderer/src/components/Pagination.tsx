// Page controls: previous and next, the shown range and the number of rows per page.
import { clampPage, pageCount, pageRange, pageSizeOptions } from '../pagination'

type PaginationProps = {
  page: number
  pageSize: number
  total: number
  onPageChange: (page: number) => void
  onPageSizeChange: (pageSize: number) => void
  actions?: React.ReactNode
}

export function Pagination({
  page,
  pageSize,
  total,
  onPageChange,
  onPageSizeChange,
  actions
}: PaginationProps): React.JSX.Element {
  const current = clampPage(page, total, pageSize)
  const pages = pageCount(total, pageSize)
  const { first, last } = pageRange(page, total, pageSize)

  return (
    <div className="pagination">
      <span className="inlineActions">
        <span className="muted">
          {first}–{last} van {total} transacties
        </span>
        {actions}
      </span>
      <span className="pagerControls">
        <label className="inlineLabel">
          Per pagina
          <select
            value={pageSize}
            onChange={(event) => onPageSizeChange(Number(event.target.value))}
          >
            {pageSizeOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
        <button
          className="secondary compact"
          disabled={current === 0}
          onClick={() => onPageChange(current - 1)}
        >
          ‹ Vorige
        </button>
        <span className="muted">
          Pagina {current + 1} van {pages}
        </span>
        <button
          className="secondary compact"
          disabled={current >= pages - 1}
          onClick={() => onPageChange(current + 1)}
        >
          Volgende ›
        </button>
      </span>
    </div>
  )
}
