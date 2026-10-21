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
  repository: DataRepository
  lock: WriterLock
}

export function createRepositoryProvider(options: ProviderOptions): RepositoryProvider {
  let current: { key: string; promise: Promise<OpenRepository> } | undefined

  const releaseLock = async (promise: Promise<OpenRepository> | undefined): Promise<void> => {
    const open = await promise?.catch(() => undefined)
    await open?.lock.release()
  }

  return {
    get: async () => {
      const { dataDir } = options.configStore.get()
      if (dataDir === null) throw new AppError('DATA_DIR_NOT_SET', 'No data folder is chosen')

      if (current?.key !== dataDir) {
        // Replace the entry before awaiting anything, so calls made at the same time share
        // one repository and one writer lock instead of each opening their own.
        const previous = current?.promise
        current = {
          key: dataDir,
          promise: releaseLock(previous).then(() => openRepository(dataDir, options))
        }
      }

      const attempt = current
      try {
        return (await attempt.promise).repository
      } catch (error) {
        if (current === attempt) current = undefined
        throw error
      }
    },
    close: async () => {
      const previous = current?.promise
      current = undefined
      await releaseLock(previous)
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
  return { repository, lock }
}
