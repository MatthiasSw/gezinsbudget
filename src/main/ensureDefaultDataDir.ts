// Gives a first-time user a default data folder so no setup step is needed before importing.
import { mkdir } from 'fs/promises'
import type { LocalConfigStore } from './localConfig'

export async function ensureDefaultDataDir(
  store: LocalConfigStore,
  defaultDir: string
): Promise<void> {
  if (store.get().dataDir !== null) return
  await mkdir(defaultDir, { recursive: true })
  await store.update({ dataDir: defaultDir })
}
