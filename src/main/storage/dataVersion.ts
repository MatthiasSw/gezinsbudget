// Tracks a change counter in the data folder so readers can detect new data cheaply.
import type { DataVersion } from '@shared/types'
import { readVersionedFile, writeVersionedFile } from './versionedFile'

export async function readDataVersion(filePath: string): Promise<DataVersion | undefined> {
  return readVersionedFile<DataVersion | undefined>(filePath, 'dataVersion', () => undefined)
}

export async function bumpDataVersion(
  filePath: string,
  updatedBy: string,
  now: () => Date
): Promise<DataVersion> {
  const current = await readDataVersion(filePath)
  const next: DataVersion = {
    counter: (current?.counter ?? 0) + 1,
    updatedAt: now().toISOString(),
    updatedBy
  }
  await writeVersionedFile(filePath, 'dataVersion', next)
  return next
}
