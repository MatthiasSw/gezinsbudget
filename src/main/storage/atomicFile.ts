// Writes JSON files atomically so readers never see a partial file, and reads them back safely.
import { randomBytes } from 'crypto'
import { open, readFile, rename, unlink } from 'fs/promises'
import { basename, dirname, join } from 'path'
import { AppError } from '@shared/errors'
import { hasErrorCode } from './fsErrors'

const retryableRenameCodes = ['EPERM', 'EBUSY', 'EACCES']
const maxRenameAttempts = 8
const firstBackoffMs = 50
const parseRetryDelayMs = 100

export type AtomicFileDependencies = {
  rename: (from: string, to: string) => Promise<void>
  sleep: (ms: number) => Promise<void>
}

const defaultDependencies: AtomicFileDependencies = {
  rename,
  sleep: (ms) => new Promise((resolve) => setTimeout(resolve, ms))
}

export async function writeJsonAtomic(
  filePath: string,
  value: unknown,
  dependencies: AtomicFileDependencies = defaultDependencies
): Promise<void> {
  const temporaryPath = buildTemporaryPath(filePath)
  try {
    await writeAndFlush(temporaryPath, `${JSON.stringify(value, null, 2)}\n`)
    await renameWithRetry(temporaryPath, filePath, dependencies)
  } catch (error) {
    await removeQuietly(temporaryPath)
    throw new AppError('WRITE_FAILED', `Could not write ${basename(filePath)}`, String(error))
  }
}

export async function readJsonIfExists(
  filePath: string,
  dependencies: Pick<AtomicFileDependencies, 'sleep'> = defaultDependencies
): Promise<unknown | undefined> {
  const content = await readTextIfExists(filePath)
  if (content === undefined) return undefined
  try {
    return JSON.parse(content)
  } catch {
    // On a network share a read can catch a file halfway through being replaced; try once more.
    await dependencies.sleep(parseRetryDelayMs)
    return parseAfterRetry(filePath)
  }
}

async function parseAfterRetry(filePath: string): Promise<unknown | undefined> {
  const content = await readTextIfExists(filePath)
  if (content === undefined) return undefined
  try {
    return JSON.parse(content)
  } catch {
    throw new AppError('CORRUPT_FILE', `${basename(filePath)} is not valid JSON`)
  }
}

async function readTextIfExists(filePath: string): Promise<string | undefined> {
  try {
    return await readFile(filePath, 'utf-8')
  } catch (error) {
    if (hasErrorCode(error, 'ENOENT')) return undefined
    throw error
  }
}

function buildTemporaryPath(filePath: string): string {
  const suffix = randomBytes(4).toString('hex')
  return join(dirname(filePath), `.${basename(filePath)}.${process.pid}.${suffix}.tmp`)
}

async function writeAndFlush(path: string, content: string): Promise<void> {
  const handle = await open(path, 'w')
  try {
    await handle.writeFile(content, 'utf-8')
    await handle.sync()
  } finally {
    await handle.close()
  }
}

async function renameWithRetry(
  from: string,
  to: string,
  dependencies: AtomicFileDependencies
): Promise<void> {
  for (let attempt = 0; attempt < maxRenameAttempts; attempt++) {
    try {
      await dependencies.rename(from, to)
      return
    } catch (error) {
      const isLastAttempt = attempt === maxRenameAttempts - 1
      if (isLastAttempt || !isRetryableRenameError(error)) throw error
      await dependencies.sleep(firstBackoffMs * 2 ** attempt)
    }
  }
}

function isRetryableRenameError(error: unknown): boolean {
  return retryableRenameCodes.some((code) => hasErrorCode(error, code))
}

async function removeQuietly(path: string): Promise<void> {
  try {
    await unlink(path)
  } catch {
    return
  }
}
