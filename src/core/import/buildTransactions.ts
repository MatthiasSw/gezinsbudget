// Converts parsed bank rows into transactions with stable ids.
import type { Transaction } from '@shared/types'
import { assignTransactionIds } from '../transactionId'
import type { ParsedRow } from './profile'

export function buildTransactions(rows: ParsedRow[], importedFrom: string): Transaction[] {
  const ids = assignTransactionIds(rows)
  return rows.map((row, index) => ({
    id: ids[index],
    accountId: row.accountId,
    bookingDate: row.bookingDate,
    valueDate: row.valueDate,
    amountCents: row.amountCents,
    currency: row.currency,
    counterpartyName: row.counterpartyName,
    counterpartyIban: row.counterpartyIban,
    message: row.message,
    description: row.description,
    statementNumber: row.statementNumber,
    transactionNumber: row.transactionNumber,
    isInternalTransfer: false,
    importedFrom
  }))
}
