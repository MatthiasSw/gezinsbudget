// Tests that the provider follows the config, holds the writer lock and reports a missing folder.
import { access, mkdir, mkdtemp, rm } from 'fs/promises'
import { tmpdir } from 'os'
import { join } from 'path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { createLocalConfigStore, type LocalConfigStore } from '../localConfig'
import { createRepositoryProvider } from './repositoryProvider'

let workDir: string
let dataDir: string
let store: LocalConfigStore

beforeEach(async () => {
  workDir = await mkdtemp(join(tmpdir(), 'provider-'))
  dataDir = join(workDir, 'data')
  await mkdir(dataDir)
  store = await createLocalConfigStore(join(workDir, 'config.json'))
})

afterEach(async () => {
  await rm(workDir, { recursive: true, force: true })
})

async function exists(path: string): Promise<boolean> {
  return access(path).then(
    () => true,
    () => false
  )
}

describe('repository provider', () => {
  it('requires a data folder to be chosen', async () => {
    const provider = createRepositoryProvider({ configStore: store, host: 'pc-a', pid: 1 })
    await expect(provider.get()).rejects.toMatchObject({ code: 'DATA_DIR_NOT_SET' })
  })

  it('initializes the folder and holds the writer lock in write mode', async () => {
    await store.update({ dataDir })
    const provider = createRepositoryProvider({ configStore: store, host: 'pc-a', pid: 1 })
    await provider.get()
    expect(await exists(join(dataDir, 'categories.json'))).toBe(true)
    expect(await exists(join(dataDir, 'writer.lock'))).toBe(true)
    await provider.close()
    expect(await exists(join(dataDir, 'writer.lock'))).toBe(false)
  })

  it('reuses the repository while the config is unchanged', async () => {
    await store.update({ dataDir })
    const provider = createRepositoryProvider({ configStore: store, host: 'pc-a', pid: 1 })
    expect(await provider.get()).toBe(await provider.get())
    await provider.close()
  })

  it('refuses a second machine while the first holds the lock', async () => {
    await store.update({ dataDir })
    const first = createRepositoryProvider({ configStore: store, host: 'pc-a', pid: 1 })
    const second = createRepositoryProvider({ configStore: store, host: 'pc-b', pid: 2 })
    await first.get()
    await expect(second.get()).rejects.toMatchObject({ code: 'LOCKED_BY_OTHER' })
    await first.close()
  })

  it('reports an unavailable folder and recovers once it exists', async () => {
    const missing = join(workDir, 'offline')
    await store.update({ dataDir: missing })
    const provider = createRepositoryProvider({ configStore: store, host: 'pc-a', pid: 1 })
    await expect(provider.get()).rejects.toMatchObject({ code: 'DATA_DIR_UNAVAILABLE' })

    await mkdir(missing)
    await expect(provider.get()).resolves.toBeDefined()
    await provider.close()
  })
})
