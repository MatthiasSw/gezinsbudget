// Reads and writes JSON files wrapped in a schemaVersion envelope, with migration on read.
import { basename } from 'path'
import { AppError } from '@shared/errors'
import { readJsonIfExists, writeJsonAtomic } from './atomicFile'
import {
  assertSupportedVersion,
  currentSchemaVersions,
  migrateToCurrent,
  type FileKind,
  type MigrationRegistry
} from './migrations'

type Envelope = { schemaVersion: unknown; data: unknown }

export async function readVersionedFile<T>(
  filePath: string,
  kind: FileKind,
  fallback: () => T,
  registry: MigrationRegistry = {}
): Promise<T> {
  const raw = await readJsonIfExists(filePath)
  if (raw === undefined) return fallback()
  const envelope = asEnvelope(raw, filePath)
  return migrateToCurrent(
    kind,
    basename(filePath),
    envelope.schemaVersion,
    envelope.data,
    registry
  ) as T
}

export async function writeVersionedFile(
  filePath: string,
  kind: FileKind,
  data: unknown
): Promise<void> {
  await refuseToOverwriteNewerFile(filePath, kind)
  await writeJsonAtomic(filePath, { schemaVersion: currentSchemaVersions[kind], data })
}

async function refuseToOverwriteNewerFile(filePath: string, kind: FileKind): Promise<void> {
  try {
    const existing = await readJsonIfExists(filePath)
    if (existing === undefined) return
    const { schemaVersion } = asEnvelope(existing, filePath)
    assertSupportedVersion(kind, basename(filePath), schemaVersion)
  } catch (error) {
    const isCorrupt = error instanceof AppError && error.code === 'CORRUPT_FILE'
    if (!isCorrupt) throw error
  }
}

function asEnvelope(raw: unknown, filePath: string): Envelope {
  if (typeof raw !== 'object' || raw === null || !('schemaVersion' in raw) || !('data' in raw)) {
    throw new AppError('CORRUPT_FILE', `${basename(filePath)} has no schemaVersion envelope`)
  }
  return raw as Envelope
}
