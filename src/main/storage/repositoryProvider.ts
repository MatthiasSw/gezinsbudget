// Opens the repository for the configured data folder and holds the writer lock while it is open.
import { AppError } from '@shared/errors'
import type { LocalConfigStore } from '../localConfig'
import { createDataPaths } from './dataPaths'
import { createDataRepository, type DataRepository } from './repository'
import { assertDirectoryAvailable } from './storageAvailability'
import { createWriterLock, type WriterLock } from './writerLock'

export type RepositoryProvider = {
  get(): Promise<DataRepository>
  close(): Promise<void>
}

export type ProviderOptions = {
  configStore: LocalConfigStore
  host: string
  pid: number
  now?: () => Date
}

type OpenRepository = {
  key: string
  repository: DataRepository
  lock?: WriterLock
}

export function createRepositoryProvider(options: ProviderOptions): RepositoryProvider {
  let opening: { key: string; promise: Promise<OpenRepository> } | undefined

  const releaseLock = async (promise: Promise<OpenRepository> | undefined): Promise<void> => {
    const open = await promise?.catch(() => undefined)
    await open?.lock?.release()
  }

  return {
    get: async () => {
      const { dataDir } = options.configStore.get()
      if (dataDir === null) throw new AppError('DATA_DIR_NOT_SET', 'No data folder is chosen')

      if (opening?.key !== dataDir) {
        await releaseLock(opening?.promise)
        opening = { key: dataDir, promise: openRepository(dataDir, options) }
      }

      try {
        return (await opening.promise).repository
      } catch (error) {
        opening = undefined
        throw error
      }
    },
    close: async () => {
      await releaseLock(opening?.promise)
      opening = undefined
    }
  }
}

async function openRepository(root: string, options: ProviderOptions): Promise<OpenRepository> {
  await assertDirectoryAvailable(root)
  const repository = createDataRepository({
    root,
    updatedBy: options.host,
    now: options.now
  })
  const lock = createWriterLock(
    createDataPaths(root).writerLock,
    { host: options.host, pid: options.pid },
    { now: options.now }
  )
  await lock.acquire()
  try {
    await repository.init()
  } catch (error) {
    await lock.release()
    throw error
  }
  return { key: root, repository, lock }
}
