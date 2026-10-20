// The transaction list: filters, selection, and assigning categories one by one or in bulk.
import { useCallback, useMemo, useState } from 'react'
import { presetRange, todayAsIso } from '@shared/periods'
import type { TransactionQuery, TransactionRef } from '@shared/transactionQuery'
import type { Transaction } from '@shared/types'
import { api } from '../api'
import { describeError } from '../errorMessages'
import { useAsyncData } from '../hooks/useAsyncData'
import { useDebouncedValue } from '../hooks/useDebouncedValue'
import { defaultPageSize, pageSizeOptions, pageSlice } from '../pagination'
import { defaultSort, nextSort, sortTransactions, type SortKey } from '../transactionSort'
import { useRuleOffer } from '../hooks/useRuleOffer'
import { CategorySelect } from './CategorySelect'
import { ExportMenu } from './ExportMenu'
import { FirstImportPrompt } from './FirstImportPrompt'
import { FilterBar, type Filters } from './FilterBar'
import { Pagination } from './Pagination'
import { RuleOfferBanner } from './RuleOfferBanner'
import { TransactionTable } from './TransactionTable'

const searchDelayMs = 250
const pageSizeMinimum = pageSizeOptions[0]

type TransactionsViewProps = {
  dataRevision: number
  onImported: () => void
  initialFilters?: Partial<Filters>
}

function defaultFilters(): Filters {
  const year = presetRange('thisYear', todayAsIso())
  return {
    from: year.from ?? '',
    to: year.to ?? '',
    accountId: '',
    categoryId: '',
    internal: 'hide',
    search: ''
  }
}

function toRef(transaction: Transaction): TransactionRef {
  return { id: transaction.id, bookingDate: transaction.bookingDate }
}

export function TransactionsView({
  dataRevision,
  onImported,
  initialFilters
}: TransactionsViewProps): React.JSX.Element {
  const [filters, setFilters] = useState<Filters>(() => ({
    ...defaultFilters(),
    ...initialFilters
  }))
  const [selectedIds, setSelectedIds] = useState<ReadonlySet<string>>(new Set())
  const [actionError, setActionError] = useState<unknown>(undefined)
  const search = useDebouncedValue(filters.search, searchDelayMs)
  const [sort, setSort] = useState(defaultSort)
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(defaultPageSize)
  const ruleOffer = useRuleOffer()

  const query = useMemo<TransactionQuery>(
    () => ({
      from: filters.from || undefined,
      to: filters.to || undefined,
      accountIds: filters.accountId ? [filters.accountId] : undefined,
      categoryId: filters.categoryId || undefined,
      search: search || undefined,
      internal: filters.internal
    }),
    [filters.from, filters.to, filters.accountId, filters.categoryId, filters.internal, search]
  )
  const loadTransactions = useCallback(() => api.transactions.query(query), [query])

  const transactions = useAsyncData(loadTransactions, dataRevision)
  const categories = useAsyncData(api.categories.get, dataRevision)
  const settings = useAsyncData(api.settings.get, dataRevision)
  const years = useAsyncData(api.overview.years, dataRevision)
  const nothingImported = years.state.status === 'ready' && years.state.data.length === 0

  const rows = transactions.state.status === 'ready' ? transactions.state.data : []

  const assign = async (refs: TransactionRef[], categoryId: string | null): Promise<void> => {
    try {
      setActionError(undefined)
      await api.transactions.setCategory({ refs, categoryId })
      const refIds = new Set(refs.map((ref) => ref.id))
      await ruleOffer.propose(
        rows.filter((row) => refIds.has(row.id)),
        categoryId
      )
      setSelectedIds(new Set())
      transactions.reload()
    } catch (error) {
      setActionError(error)
    }
  }

  const categoryList = categories.state.status === 'ready' ? categories.state.data : []
  const accounts = settings.state.status === 'ready' ? settings.state.data.accounts : []
  const sortedRows = sortTransactions(rows, sort, accounts, categoryList)
  const pageRows = pageSlice(sortedRows, page, pageSize)
  const changeSort = (key: SortKey): void => {
    setSort(nextSort(sort, key))
    setPage(0)
  }
  const changeFilters = (changes: Partial<Filters>): void => {
    setFilters({ ...filters, ...changes })
    setPage(0)
  }
  const changePageSize = (size: number): void => {
    setPageSize(size)
    setPage(0)
  }

  const toggle = (id: string): void => {
    const next = new Set(selectedIds)
    if (!next.delete(id)) next.add(id)
    setSelectedIds(next)
  }
  const toggleAll = (): void => {
    const allSelected = pageRows.length > 0 && pageRows.every((row) => selectedIds.has(row.id))
    const next = new Set(selectedIds)
    for (const row of pageRows) {
      if (allSelected) next.delete(row.id)
      else next.add(row.id)
    }
    setSelectedIds(next)
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

      {selectedIds.size > 0 && (
        <div className="bulkBar">
          <strong>{selectedIds.size} geselecteerd</strong>
          {selectedIds.size < rows.length && (
            <button
              className="secondary compact"
              onClick={() => setSelectedIds(new Set(rows.map((row) => row.id)))}
            >
              Alle {rows.length} selecteren
            </button>
          )}
          <CategorySelect
            categories={categoryList}
            value={undefined}
            emptyLabel="Categorie kiezen voor selectie…"
            onChange={(categoryId) =>
              assign(rows.filter((row) => selectedIds.has(row.id)).map(toRef), categoryId)
            }
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
          selectedIds={selectedIds}
          onToggle={toggle}
          onToggleAll={toggleAll}
          onCategoryChange={(transaction, categoryId) => assign([toRef(transaction)], categoryId)}
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
