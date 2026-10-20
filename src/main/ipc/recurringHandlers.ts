// Handles the IPC channel for recurring expenses by delegating to the recurring service.
import type { IpcHandlers } from '@shared/ipc'
import type { RecurringService } from '../services/recurringService'

export type RecurringHandlers = Pick<IpcHandlers, 'recurring:get'>

export function createRecurringHandlers(service: RecurringService): RecurringHandlers {
  return {
    'recurring:get': () => service.get()
  }
}
