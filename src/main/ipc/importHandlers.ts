// Handles the IPC channels of the import flow by delegating to the import service.
import type { IpcHandlers } from '@shared/ipc'
import type { ImportService } from '../services/importService'

export type ImportHandlers = Pick<
  IpcHandlers,
  'import:pick' | 'import:resume' | 'import:confirm' | 'import:cancel'
>

export function createImportHandlers(service: ImportService): ImportHandlers {
  return {
    'import:pick': () => service.pick(),
    'import:resume': (token) => service.resume(token),
    'import:confirm': (token) => service.confirm(token),
    'import:cancel': async (token) => service.cancel(token)
  }
}
