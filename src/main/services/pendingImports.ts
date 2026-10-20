// Keeps picked import files in memory for a limited time, addressed by an unguessable token.
import { randomUUID } from 'crypto'
import { AppError } from '@shared/errors'

const defaultTimeToLiveMs = 10 * 60 * 1000

export type PendingImportsOptions = {
  now?: () => Date
  createToken?: () => string
  timeToLiveMs?: number
}

export type PendingImports<T> = {
  add(value: T): string
  get(token: string): T
  replace(token: string, value: T): void
  remove(token: string): void
}

type Entry<T> = { value: T; expiresAt: number }

export function createPendingImports<T>(options: PendingImportsOptions = {}): PendingImports<T> {
  const now = options.now ?? (() => new Date())
  const createToken = options.createToken ?? randomUUID
  const timeToLiveMs = options.timeToLiveMs ?? defaultTimeToLiveMs
  const entries = new Map<string, Entry<T>>()

  const expiry = (): number => now().getTime() + timeToLiveMs

  const removeExpired = (): void => {
    for (const [token, entry] of entries) {
      if (entry.expiresAt <= now().getTime()) entries.delete(token)
    }
  }

  return {
    add: (value) => {
      removeExpired()
      const token = createToken()
      entries.set(token, { value, expiresAt: expiry() })
      return token
    },
    get: (token) => {
      removeExpired()
      const entry = entries.get(token)
      if (!entry) throw new AppError('UNKNOWN', 'This import has expired, pick the file again')
      return entry.value
    },
    replace: (token, value) => {
      entries.set(token, { value, expiresAt: expiry() })
    },
    remove: (token) => {
      entries.delete(token)
    }
  }
}
