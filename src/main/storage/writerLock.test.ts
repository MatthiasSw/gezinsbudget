// Tests the writer lock: exclusivity across hosts, stale locks, heartbeat and release.
import { access, mkdtemp, readdir, rm, writeFile } from 'fs/promises'
import { tmpdir } from 'os'
import { join } from 'path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { readJsonIfExists } from './atomicFile'
import { createWriterLock } from './writerLock'

let directory: string
let lockPath: string
let currentTime: number
const now = (): Date => new Date(currentTime)
const hostA = { host: 'pc-a', pid: 100 }
const hostB = { host: 'pc-b', pid: 200 }

beforeEach(async () => {
  directory = await mkdtemp(join(tmpdir(), 'lock-'))
  lockPath = join(directory, 'writer.lock')
  currentTime = Date.parse('2026-01-05T10:00:00.000Z')
})

afterEach(async () => {
  await rm(directory, { recursive: true, force: true })
})

async function exists(path: string): Promise<boolean> {
  return access(path).then(
    () => true,
    () => false
  )
}

describe('writer lock', () => {
  it('can be acquired on a free folder and released again', async () => {
    const lock = createWriterLock(lockPath, hostA, { now })
    await lock.acquire()
    expect(await exists(lockPath)).toBe(true)
    await lock.release()
    expect(await exists(lockPath)).toBe(false)
  })

  it('refuses when another host holds a fresh lock', async () => {
    const first = createWriterLock(lockPath, hostA, { now })
    await first.acquire()
    currentTime += 60 * 1000

    const second = createWriterLock(lockPath, hostB, { now })
    await expect(second.acquire()).rejects.toMatchObject({
      code: 'LOCKED_BY_OTHER',
      details: { host: 'pc-a' }
    })
    await first.release()
  })

  it('takes over a stale lock from another host', async () => {
    const first = createWriterLock(lockPath, hostA, { now })
    await first.acquire()
    currentTime += 16 * 60 * 1000

    const second = createWriterLock(lockPath, hostB, { now })
    await expect(second.acquire()).resolves.toBeUndefined()
    await first.release()
    await second.release()
  })

  it('takes over a lock left behind on the same host', async () => {
    const crashed = createWriterLock(lockPath, hostA, { now })
    await crashed.acquire()
    const restarted = createWriterLock(lockPath, { host: 'pc-a', pid: 999 }, { now })
    await expect(restarted.acquire()).resolves.toBeUndefined()
    await crashed.release()
    await restarted.release()
  })

  it('does not remove a lock that belongs to someone else on release', async () => {
    const mine = createWriterLock(lockPath, hostA, { now })
    await mine.acquire()
    const other = createWriterLock(lockPath, hostB, { now, staleAfterMs: 0 })
    await other.acquire()
    await mine.release()
    expect(await exists(lockPath)).toBe(true)
    await other.release()
  })

  it('refreshes the heartbeat on an interval', async () => {
    const lock = createWriterLock(lockPath, hostA, { now, heartbeatIntervalMs: 20 })
    await lock.acquire()
    currentTime += 5000
    const expected = new Date(currentTime).toISOString()
    await vi.waitFor(
      async () => {
        const stored = (await readJsonIfExists(lockPath)) as { heartbeat: string }
        expect(stored.heartbeat).toBe(expected)
      },
      { timeout: 5000, interval: 25 }
    )
    await lock.release()
  })

  it('leaves nothing behind when released during a busy heartbeat', async () => {
    const lock = createWriterLock(lockPath, hostA, { now, heartbeatIntervalMs: 1 })
    await lock.acquire()
    await new Promise((resolve) => setTimeout(resolve, 60))
    await lock.release()
    expect(await readdir(directory)).toEqual([])
  })

  it('treats a corrupt lock file as free', async () => {
    await writeFile(lockPath, '{ broken')
    const lock = createWriterLock(lockPath, hostA, { now })
    await expect(lock.acquire()).resolves.toBeUndefined()
    await lock.release()
  })
})
