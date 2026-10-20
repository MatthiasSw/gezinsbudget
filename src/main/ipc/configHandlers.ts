// Handles the IPC channels that read and change the local config.
import type { IpcHandlers } from '@shared/ipc'
import type { LocalConfigStore } from '../localConfig'

export type ConfigHandlerDependencies = {
  store: LocalConfigStore
  chooseDirectory: () => Promise<string | null>
}

export type ConfigHandlers = Pick<IpcHandlers, 'config:get' | 'config:chooseDataDir'>

export function createConfigHandlers({
  store,
  chooseDirectory
}: ConfigHandlerDependencies): ConfigHandlers {
  return {
    'config:get': async () => store.get(),
    'config:chooseDataDir': async () => {
      const directory = await chooseDirectory()
      if (directory === null) return null
      return store.update({ dataDir: directory })
    }
  }
}
