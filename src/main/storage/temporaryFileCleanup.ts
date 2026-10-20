// Removes leftover temporary files from interrupted writes.
import { readdir, stat, unlink } from 'fs/promises'
import { join } from 'path'

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
    const path = join(directory, name)
    const { mtimeMs } = await stat(path)
    if (now().getTime() - mtimeMs > maxAgeMs) await unlink(path)
  }
}

async function listTemporaryFileNames(directory: string): Promise<string[]> {
  try {
    const names = await readdir(directory)
    return names.filter((name) => name.startsWith('.') && name.endsWith('.tmp'))
  } catch (error) {
    if ((error as { code?: string }).code === 'ENOENT') return []
    throw error
  }
}
