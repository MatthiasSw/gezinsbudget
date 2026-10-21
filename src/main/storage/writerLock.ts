// Prevents two machines from editing the same data folder at the same time.
import { unlink } from 'fs/promises'
import { AppError } from '@shared/errors'
import { readJsonIfExists, writeJsonAtomic } from './atomicFile'

const defaultStaleAfterMs = 15 * 60 * 1000
const defaultHeartbeatIntervalMs = 5 * 60 * 1000

export type LockIdentity = {
  host: string
  pid: number
}

export type WriterLockOptions = {
  now?: () => Date
  staleAfterMs?: number
  heartbeatIntervalMs?: number
}

export type WriterLock = {
  acquire(): Promise<void>
  release(): Promise<void>
}

type LockFile = LockIdentity & { startedAt: string; heartbeat: string }

export function createWriterLock(
  filePath: string,
  identity: LockIdentity,
  options: WriterLockOptions = {}
): WriterLock {
  const now = options.now ?? (() => new Date())
  const staleAfterMs = options.staleAfterMs ?? defaultStaleAfterMs
  const heartbeatIntervalMs = options.heartbeatIntervalMs ?? defaultHeartbeatIntervalMs
  let startedAt = now().toISOString()
  let heartbeatTimer: NodeJS.Timeout | undefined
  let heartbeatWrite: Promise<void> = Promise.resolve()

  const writeLock = (): Promise<void> => {
    const content: LockFile = { ...identity, startedAt, heartbeat: now().toISOString() }
    return writeJsonAtomic(filePath, content)
  }

  const isHeldByOtherAndFresh = (existing: LockFile | undefined): boolean => {
    if (!existing || existing.host === identity.host) return false
    return now().getTime() - Date.parse(existing.heartbeat) < staleAfterMs
  }

  const startHeartbeat = (): void => {
    clearInterval(heartbeatTimer)
    let writing = false
    heartbeatTimer = setInterval(() => {
      if (writing) return
      writing = true
      heartbeatWrite = writeLock()
        .catch(() => undefined)
        .finally(() => {
          writing = false
        })
    }, heartbeatIntervalMs)
    heartbeatTimer.unref()
  }

  return {
    acquire: async () => {
      const existing = await readLockFile(filePath)
      if (isHeldByOtherAndFresh(existing)) {
        throw new AppError('LOCKED_BY_OTHER', `Data is being edited on ${existing?.host}`, {
          host: existing?.host
        })
      }
      startedAt = now().toISOString()
      await writeLock()
      startHeartbeat()
    },
    release: async () => {
      clearInterval(heartbeatTimer)
      await heartbeatWrite
      const existing = await readLockFile(filePath)
      const isOurs = existing?.host === identity.host && existing.pid === identity.pid
      if (isOurs) await unlink(filePath).catch(() => undefined)
    }
  }
}

async function readLockFile(filePath: string): Promise<LockFile | undefined> {
  try {
    const raw = await readJsonIfExists(filePath)
    return isLockFile(raw) ? raw : undefined
  } catch (error) {
    if (error instanceof AppError && error.code === 'CORRUPT_FILE') return undefined
    throw error
  }
}

function isLockFile(value: unknown): value is LockFile {
  if (typeof value !== 'object' || value === null) return false
  const candidate = value as Partial<LockFile>
  return (
    typeof candidate.host === 'string' &&
    typeof candidate.pid === 'number' &&
    typeof candidate.heartbeat === 'string'
  )
}
