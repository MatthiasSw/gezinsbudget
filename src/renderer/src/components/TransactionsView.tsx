// The transaction list: filters, selection, and assigning categories one by one or in bulk.
import { useCallback, useMemo, useState } from 'react'
import type { TransactionQuery } from '@shared/transactionQuery'
import type { Transaction } from '@shared/types'
import { api } from '../api'
import { describeError } from '../errorMessages'
import { defaultFilters, type Filters } from '../filters'
import { useAccounts } from '../hooks/useAccounts'
import { useAsyncData } from '../hooks/useAsyncData'
import { useCategories } from '../hooks/useCategories'
import { useDebouncedValue } from '../hooks/useDebouncedValue'
import { useRuleOffer } from '../hooks/useRuleOffer'
import { useSelection } from '../hooks/useSelection'
import { defaultPageSize, pageSizeOptions, pageSlice } from '../pagination'
import { defaultSort, nextSort, sortTransactions, type SortKey } from '../transactionSort'
import { CategorySelect } from './CategorySelect'
import { ExportMenu } from './ExportMenu'
import { FirstImportPrompt } from './FirstImportPrompt'
import { FilterBar } from './FilterBar'
import { Pagination } from './Pagination'
import { RuleOfferBanner } from './RuleOfferBanner'
import { TransactionTable } from './TransactionTable'

const searchDelayMs = 250
const pageSizeMinimum = pageSizeOptions[0]

type TransactionsViewProps = {
  dataRevision: number
  onImported: () => void
  initialFilters?: Filters
}

// The search text comes in separately, because it follows the typing with a delay.
function toQuery(filters: Omit<Filters, 'search'>, search: string): TransactionQuery {
  return {
    from: filters.from || undefined,
    to: filters.to || undefined,
    accountIds: filters.accountId ? [filters.accountId] : undefined,
    categoryId: filters.categoryId || undefined,
    search: search || undefined,
    internal: filters.internal
  }
}

export function TransactionsView({
  dataRevision,
  onImported,
  initialFilters
}: TransactionsViewProps): React.JSX.Element {
  const [filters, setFilters] = useState<Filters>(() => initialFilters ?? defaultFilters())
  const [actionError, setActionError] = useState<unknown>(undefined)
  const search = useDebouncedValue(filters.search, searchDelayMs)
  const [sort, setSort] = useState(defaultSort)
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(defaultPageSize)
  const ruleOffer = useRuleOffer()

  const { from, to, accountId, categoryId, internal } = filters
  const query = useMemo(
    () => toQuery({ from, to, accountId, categoryId, internal }, search),
    [from, to, accountId, categoryId, internal, search]
  )
  const loadTransactions = useCallback(() => api.transactions.query(query), [query])

  const transactions = useAsyncData(loadTransactions, dataRevision)
  const categoryList = useCategories(dataRevision)
  const accounts = useAccounts(dataRevision)
  const years = useAsyncData(api.overview.years, dataRevision)
  const nothingImported = years.state.status === 'ready' && years.state.data.length === 0

  const rows = transactions.state.status === 'ready' ? transactions.state.data : []
  const selection = useSelection(rows)
  const sortedRows = sortTransactions(rows, sort, accounts, categoryList)
  const pageRows = pageSlice(sortedRows, page, pageSize)

  const assign = async (assigned: Transaction[], categoryId: string | null): Promise<void> => {
    try {
      setActionError(undefined)
      const refs = assigned.map(({ id, bookingDate }) => ({ id, bookingDate }))
      await api.transactions.setCategory({ refs, categoryId })
      await ruleOffer.propose(assigned, categoryId)
      selection.clear()
      transactions.reload()
    } catch (error) {
      setActionError(error)
    }
  }

  const changeSort = (key: SortKey): void => {
    setSort(nextSort(sort, key))
    setPage(0)
  }
  const changeFilters = (changes: Partial<Filters>): void => {
    setFilters({ ...filters, ...changes })
    setPage(0)
    selection.clear()
  }
  const changePageSize = (size: number): void => {
    setPageSize(size)
    setPage(0)
  }

  if (nothingImported) return <FirstImportPrompt onImported={onImported} />

  return (
    <section>
      <FilterBar
        filters={filters}
        accounts={accounts}
        categories={categoryList}
        onChange={changeFilters}
      />

      {selection.selectedRows.length > 0 && (
        <div className="bulkBar">
          <strong>{selection.selectedRows.length} geselecteerd</strong>
          {selection.selectedRows.length < rows.length && (
            <button className="secondary compact" onClick={selection.selectAll}>
              Alle {rows.length} selecteren
            </button>
          )}
          <CategorySelect
            categories={categoryList}
            value={undefined}
            emptyLabel="Categorie kiezen voor selectie…"
            onChange={(chosen) => assign(selection.selectedRows, chosen)}
          />
        </div>
      )}

      {ruleOffer.offer && (
        <RuleOfferBanner
          offer={ruleOffer.offer}
          categoryName={
            categoryList.find((category) => category.id === ruleOffer.offer?.categoryId)?.name ?? ''
          }
          onDismiss={ruleOffer.dismiss}
        />
      )}
      {actionError !== undefined && <p className="errorText">{describeError(actionError)}</p>}
      {transactions.state.status === 'error' && (
        <p className="errorText">{describeError(transactions.state.error)}</p>
      )}
      {transactions.state.status === 'ready' && rows.length === 0 && (
        <p className="muted">Geen transacties gevonden voor deze filters.</p>
      )}

      {rows.length > 0 && (
        <Pagination
          page={page}
          pageSize={pageSize}
          total={rows.length}
          onPageChange={setPage}
          onPageSizeChange={changePageSize}
          actions={<ExportMenu query={query} count={rows.length} />}
        />
      )}
      {rows.length > 0 && (
        <TransactionTable
          transactions={pageRows}
          sort={sort}
          onSortChange={changeSort}
          accounts={accounts}
          categories={categoryList}
          selectedIds={selection.selectedIds}
          onToggle={selection.toggle}
          onToggleAll={() => selection.toggleAll(pageRows)}
          onCategoryChange={(transaction, chosen) => assign([transaction], chosen)}
        />
      )}
      {rows.length > pageSizeMinimum && (
        <Pagination
          page={page}
          pageSize={pageSize}
          total={rows.length}
          onPageChange={setPage}
          onPageSizeChange={changePageSize}
        />
      )}
    </section>
  )
}
