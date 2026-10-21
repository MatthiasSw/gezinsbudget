// Small helpers for Node file system errors, which carry their reason in a string code.
import { readdir } from 'fs/promises'

export function errorCode(error: unknown): string | undefined {
  if (typeof error !== 'object' || error === null) return undefined
  const { code } = error as { code?: unknown }
  return typeof code === 'string' ? code : undefined
}

export function hasErrorCode(error: unknown, code: string): boolean {
  return errorCode(error) === code
}

export async function readDirectoryIfExists(directory: string): Promise<string[]> {
  try {
    return await readdir(directory)
  } catch (error) {
    if (hasErrorCode(error, 'ENOENT')) return []
    throw error
  }
}
