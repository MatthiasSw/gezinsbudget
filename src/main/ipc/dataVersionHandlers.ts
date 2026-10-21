// Handles the IPC channel that reports the data version, which also proves the data folder is reachable.
import type { IpcHandlers } from '@shared/ipc'
import type { GetRepository } from '../storage/repository'

export type DataVersionHandlerDependencies = {
  getRepository: GetRepository
}

export type DataVersionHandlers = Pick<IpcHandlers, 'data:version'>

export function createDataVersionHandlers({
  getRepository
}: DataVersionHandlerDependencies): DataVersionHandlers {
  return {
    'data:version': async () => {
      const repository = await getRepository()
      return (await repository.getDataVersion()) ?? null
    }
  }
}
