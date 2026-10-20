// Tests that a default data folder is created only for a user without a chosen folder.
import { mkdtemp, rm, stat } from 'fs/promises'
import { tmpdir } from 'os'
import { join } from 'path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { ensureDefaultDataDir } from './ensureDefaultDataDir'
import { createLocalConfigStore } from './localConfig'

let directory: string

beforeEach(async () => {
  directory = await mkdtemp(join(tmpdir(), 'defaultdir-'))
})

afterEach(async () => {
  await rm(directory, { recursive: true, force: true })
})

describe('ensureDefaultDataDir', () => {
  it('creates and stores the default folder when none is chosen', async () => {
    const store = await createLocalConfigStore(join(directory, 'config.json'))
    const defaultDir = join(directory, 'nested', 'Gezinsbudget')

    await ensureDefaultDataDir(store, defaultDir)

    expect(store.get().dataDir).toBe(defaultDir)
    expect((await stat(defaultDir)).isDirectory()).toBe(true)
  })

  it('keeps an already chosen folder', async () => {
    const store = await createLocalConfigStore(join(directory, 'config.json'))
    await store.update({ dataDir: 'D:/budget' })

    await ensureDefaultDataDir(store, join(directory, 'Gezinsbudget'))

    expect(store.get().dataDir).toBe('D:/budget')
  })
})
