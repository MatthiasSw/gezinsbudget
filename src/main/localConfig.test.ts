// Tests loading, defaults and persistence of the local config.
import { mkdtemp, rm, writeFile } from 'fs/promises'
import { tmpdir } from 'os'
import { join } from 'path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { createLocalConfigStore } from './localConfig'

let directory: string
let filePath: string

beforeEach(async () => {
  directory = await mkdtemp(join(tmpdir(), 'localconfig-'))
  filePath = join(directory, 'config.json')
})

afterEach(async () => {
  await rm(directory, { recursive: true, force: true })
})

describe('createLocalConfigStore', () => {
  it('starts with defaults when no file exists', async () => {
    const store = await createLocalConfigStore(filePath)
    expect(store.get()).toEqual({
      schemaVersion: 1,
      dataDir: null
    })
  })

  it('persists updates across store instances', async () => {
    const first = await createLocalConfigStore(filePath)
    await first.update({ dataDir: 'D:/budget' })

    const second = await createLocalConfigStore(filePath)
    expect(second.get().dataDir).toBe('D:/budget')
  })

  it('falls back to defaults for a corrupt file', async () => {
    await writeFile(filePath, '{ broken')
    const store = await createLocalConfigStore(filePath)
    expect(store.get().dataDir).toBeNull()
  })

  it('keeps valid fields and ignores fields it does not know', async () => {
    await writeFile(
      filePath,
      JSON.stringify({ schemaVersion: 1, dataDir: 'E:/data', readOnly: true })
    )
    const store = await createLocalConfigStore(filePath)
    expect(store.get()).toEqual({ schemaVersion: 1, dataDir: 'E:/data' })
  })

  it('refuses a config written by a newer version', async () => {
    await writeFile(filePath, JSON.stringify({ schemaVersion: 2 }))
    await expect(createLocalConfigStore(filePath)).rejects.toMatchObject({
      code: 'UNSUPPORTED_SCHEMA'
    })
  })
})
