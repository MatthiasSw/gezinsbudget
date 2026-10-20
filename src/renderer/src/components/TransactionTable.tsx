// Table of transactions with selection and a category dropdown per row.
import { formatBelgianDate } from '@shared/dates'
import { formatCents } from '@shared/money'
import type { Account, Category, Transaction } from '@shared/types'
import { CategorySelect } from './CategorySelect'
import type { SortKey, TransactionSort } from '../transactionSort'
import { ExpandableText } from './ExpandableText'
import { SortableHeader } from './SortableHeader'

type TransactionTableProps = {
  transactions: Transaction[]
  accounts: Account[]
  categories: Category[]
  selectedIds: ReadonlySet<string>
  sort: TransactionSort
  onSortChange: (key: SortKey) => void
  onToggle: (id: string) => void
  onToggleAll: () => void
  onCategoryChange: (transaction: Transaction, categoryId: string | null) => void
}

export function TransactionTable({
  transactions,
  accounts,
  categories,
  selectedIds,
  sort,
  onSortChange,
  onToggle,
  onToggleAll,
  onCategoryChange
}: TransactionTableProps): React.JSX.Element {
  const accountNames = new Map(accounts.map((account) => [account.iban, account.name]))
  const allSelected = transactions.length > 0 && transactions.every((t) => selectedIds.has(t.id))

  const header = (key: SortKey, label: string, className?: string): React.JSX.Element => (
    <SortableHeader
      label={label}
      className={className}
      active={sort.key === key}
      direction={sort.direction}
      onClick={() => onSortChange(key)}
    />
  )

  return (
    <table className="transactions">
      <thead>
        <tr>
          <th>
            <input
              type="checkbox"
              aria-label="Alles selecteren"
              checked={allSelected}
              onChange={onToggleAll}
            />
          </th>
          {header('date', 'Datum')}
          {header('account', 'Rekening')}
          {header('counterparty', 'Tegenpartij')}
          <th>Mededeling</th>
          {header('amount', 'Bedrag', 'amount')}
          {header('category', 'Categorie')}
        </tr>
      </thead>
      <tbody>
        {transactions.map((transaction) => (
          <tr key={transaction.id} className={transaction.isInternalTransfer ? 'internal' : ''}>
            <td>
              <input
                type="checkbox"
                aria-label="Selecteren"
                checked={selectedIds.has(transaction.id)}
                onChange={() => onToggle(transaction.id)}
              />
            </td>
            <td className="nowrap">{formatBelgianDate(transaction.bookingDate)}</td>
            <td>{accountNames.get(transaction.accountId) ?? transaction.accountId}</td>
            <td>
              {transaction.isInternalTransfer && <span title="Interne overboeking">⇄ </span>}
              {transaction.counterpartyName}
            </td>
            <td className="messageCell">
              <ExpandableText text={transaction.message ?? ''} />
            </td>
            <td className={transaction.amountCents < 0 ? 'amount negative' : 'amount positive'}>
              {formatCents(transaction.amountCents)}
            </td>
            <td>
              <CategorySelect
                categories={categories}
                value={transaction.categoryId}
                emptyLabel="Geen categorie"
                onChange={(categoryId) => onCategoryChange(transaction, categoryId)}
              />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
