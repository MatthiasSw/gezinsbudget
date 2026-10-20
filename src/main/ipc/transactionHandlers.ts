// Handles the IPC channels for the transaction list and manual categories.
import type { IpcHandlers } from '@shared/ipc'
import type { TransactionService } from '../services/transactionService'

export type TransactionHandlers = Pick<
  IpcHandlers,
  'transactions:query' | 'transactions:setCategory' | 'transactions:export'
>

export function createTransactionHandlers(service: TransactionService): TransactionHandlers {
  return {
    'transactions:query': (query) => service.query(query),
    'transactions:setCategory': (request) => service.setCategory(request),
    'transactions:export': (query) => service.exportCsv(query)
  }
}
