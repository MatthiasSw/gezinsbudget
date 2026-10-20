// Tests the config IPC handlers against an in-memory store.
import { describe, expect, it, vi } from 'vitest'
import type { LocalConfig } from '@shared/types'
import type { LocalConfigStore } from '../localConfig'
import { createConfigHandlers } from './configHandlers'

function createFakeStore(): LocalConfigStore {
  let config: LocalConfig = {
    schemaVersion: 1,
    dataDir: null
  }
  return {
    get: () => config,
    update: async (patch) => (config = { ...config, ...patch })
  }
}

describe('config handlers', () => {
  it('stores the chosen data directory', async () => {
    const handlers = createConfigHandlers({
      store: createFakeStore(),
      chooseDirectory: async () => 'D:/budget'
    })
    const result = await handlers['config:chooseDataDir']()
    expect(result?.dataDir).toBe('D:/budget')
  })

  it('keeps the config unchanged when the dialog is cancelled', async () => {
    const store = createFakeStore()
    const update = vi.spyOn(store, 'update')
    const handlers = createConfigHandlers({ store, chooseDirectory: async () => null })
    expect(await handlers['config:chooseDataDir']()).toBeNull()
    expect(update).not.toHaveBeenCalled()
  })
})
