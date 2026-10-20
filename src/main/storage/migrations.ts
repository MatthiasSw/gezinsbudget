// Upgrades older file contents to the current schema version and refuses newer ones.
import { AppError } from '@shared/errors'

export type FileKind =
  'settings' | 'categories' | 'rules' | 'budgets' | 'transactions' | 'dataVersion'

export const currentSchemaVersions: Record<FileKind, number> = {
  settings: 1,
  categories: 1,
  rules: 2,
  budgets: 1,
  transactions: 1,
  dataVersion: 1
}

type Migration = (data: unknown) => unknown

export type MigrationRegistry = Partial<Record<FileKind, Record<number, Migration>>>

export function assertSupportedVersion(
  kind: FileKind,
  fileName: string,
  schemaVersion: unknown,
  currentVersions: Record<FileKind, number> = currentSchemaVersions
): void {
  if (!Number.isInteger(schemaVersion) || (schemaVersion as number) < 1) {
    throw new AppError('CORRUPT_FILE', `${fileName} has an invalid schemaVersion`)
  }
  if ((schemaVersion as number) > currentVersions[kind]) {
    throw new AppError('UNSUPPORTED_SCHEMA', `${fileName} was written by a newer version`)
  }
}

export function migrateToCurrent(
  kind: FileKind,
  fileName: string,
  schemaVersion: unknown,
  data: unknown,
  registry: MigrationRegistry = {},
  currentVersions: Record<FileKind, number> = currentSchemaVersions
): unknown {
  assertSupportedVersion(kind, fileName, schemaVersion, currentVersions)

  let version = schemaVersion as number
  let migrated = data
  while (version < currentVersions[kind]) {
    const migration = registry[kind]?.[version]
    if (!migration) throw new AppError('CORRUPT_FILE', `${fileName} cannot be migrated`)
    migrated = migration(migrated)
    version++
  }
  return migrated
}
