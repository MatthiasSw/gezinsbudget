// Stores per-user settings (the data folder) outside the shared data folder.
import type { LocalConfig } from '@shared/types'
import { AppError } from '@shared/errors'
import { readJsonIfExists, writeJsonAtomic } from './storage/atomicFile'

const currentSchemaVersion = 1

export type LocalConfigPatch = Partial<Pick<LocalConfig, 'dataDir'>>

export type LocalConfigStore = {
  get(): LocalConfig
  update(patch: LocalConfigPatch): Promise<LocalConfig>
}

export async function createLocalConfigStore(filePath: string): Promise<LocalConfigStore> {
  let stored = await loadStoredConfig(filePath)

  return {
    get: () => stored,
    update: async (patch) => {
      const next = { ...stored, ...patch }
      await writeJsonAtomic(filePath, next)
      stored = next
      return stored
    }
  }
}

async function loadStoredConfig(filePath: string): Promise<LocalConfig> {
  try {
    return parseLocalConfig(await readJsonIfExists(filePath))
  } catch (error) {
    if (error instanceof AppError && error.code === 'CORRUPT_FILE') return buildDefaultConfig()
    throw error
  }
}

function parseLocalConfig(raw: unknown): LocalConfig {
  const defaults = buildDefaultConfig()
  if (typeof raw !== 'object' || raw === null) return defaults

  const candidate = raw as Partial<Record<keyof LocalConfig, unknown>>
  if (
    typeof candidate.schemaVersion === 'number' &&
    candidate.schemaVersion > currentSchemaVersion
  ) {
    throw new AppError('UNSUPPORTED_SCHEMA', 'config.json was written by a newer version')
  }

  return {
    schemaVersion: currentSchemaVersion,
    dataDir: typeof candidate.dataDir === 'string' ? candidate.dataDir : defaults.dataDir
  }
}

function buildDefaultConfig(): LocalConfig {
  return {
    schemaVersion: currentSchemaVersion,
    dataDir: null
  }
}
