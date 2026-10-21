// Removes leftover temporary files from interrupted writes.
import { stat, unlink } from 'fs/promises'
import { join } from 'path'
import { hasErrorCode, readDirectoryIfExists } from './fsErrors'

const oneHourMs = 60 * 60 * 1000

export type CleanupOptions = {
  maxAgeMs?: number
  now?: () => Date
}

export async function removeStaleTemporaryFiles(
  directory: string,
  options: CleanupOptions = {}
): Promise<void> {
  const maxAgeMs = options.maxAgeMs ?? oneHourMs
  const now = options.now ?? (() => new Date())

  for (const name of await listTemporaryFileNames(directory)) {
    await removeIfOlderThan(join(directory, name), now().getTime() - maxAgeMs)
  }
}

async function listTemporaryFileNames(directory: string): Promise<string[]> {
  const names = await readDirectoryIfExists(directory)
  return names.filter((name) => name.startsWith('.') && name.endsWith('.tmp'))
}

// A file that disappears in the meantime was finished or cleaned up by another process.
async function removeIfOlderThan(path: string, oldestAllowedMs: number): Promise<void> {
  try {
    const { mtimeMs } = await stat(path)
    if (mtimeMs < oldestAllowedMs) await unlink(path)
  } catch (error) {
    if (!hasErrorCode(error, 'ENOENT')) throw error
  }
}
