// Handles the IPC channel that reports the data version, which also proves the data folder is reachable.
import type { IpcHandlers } from '@shared/ipc'
import type { DataRepository } from '../storage/repository'

export type DataVersionHandlerDependencies = {
  getRepository: () => Promise<DataRepository>
}

export type DataVersionHandlers = Pick<IpcHandlers, 'data:version'>

export function createDataVersionHandlers({
  getRepository
}: DataVersionHandlerDependencies): DataVersionHandlers {
  return {
    'data:version': async () => (await (await getRepository()).getDataVersion()) ?? null
  }
}
