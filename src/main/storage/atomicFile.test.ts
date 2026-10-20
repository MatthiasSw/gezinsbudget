// Tests atomic JSON writing and safe reading.
import { mkdtemp, readdir, readFile, rename, rm, writeFile } from 'fs/promises'
import { tmpdir } from 'os'
import { join } from 'path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { AppError } from '@shared/errors'
import { readJsonIfExists, writeJsonAtomic, type AtomicFileDependencies } from './atomicFile'

let directory: string

beforeEach(async () => {
  directory = await mkdtemp(join(tmpdir(), 'atomic-'))
})

afterEach(async () => {
  await rm(directory, { recursive: true, force: true })
})

function failingRename(code: string, failures: number): AtomicFileDependencies['rename'] {
  let remaining = failures
  return async (from, to) => {
    if (remaining-- > 0) throw Object.assign(new Error(code), { code })
    await rename(from, to)
  }
}

describe('writeJsonAtomic', () => {
  it('writes a file that can be read back', async () => {
    const path = join(directory, 'data.json')
    await writeJsonAtomic(path, { name: 'Gezinsbudget' })
    expect(JSON.parse(await readFile(path, 'utf-8'))).toEqual({ name: 'Gezinsbudget' })
  })

  it('leaves no temporary files behind after success', async () => {
    await writeJsonAtomic(join(directory, 'data.json'), { a: 1 })
    expect(await readdir(directory)).toEqual(['data.json'])
  })

  it('overwrites an existing file', async () => {
    const path = join(directory, 'data.json')
    await writeJsonAtomic(path, { version: 1 })
    await writeJsonAtomic(path, { version: 2 })
    expect(await readJsonIfExists(path)).toEqual({ version: 2 })
  })

  it('retries the rename when the file is temporarily locked', async () => {
    const path = join(directory, 'data.json')
    const sleep = vi.fn().mockResolvedValue(undefined)
    await writeJsonAtomic(path, { ok: true }, { rename: failingRename('EPERM', 2), sleep })
    expect(await readJsonIfExists(path)).toEqual({ ok: true })
    expect(sleep.mock.calls.map(([ms]) => ms)).toEqual([50, 100])
  })

  it('gives up after repeated failures and cleans up the temporary file', async () => {
    const path = join(directory, 'data.json')
    const sleep = vi.fn().mockResolvedValue(undefined)
    await expect(
      writeJsonAtomic(path, { ok: true }, { rename: failingRename('EBUSY', 99), sleep })
    ).rejects.toMatchObject({ code: 'WRITE_FAILED' })
    expect(await readdir(directory)).toEqual([])
  })

  it('does not retry errors that are not lock related', async () => {
    const sleep = vi.fn().mockResolvedValue(undefined)
    await expect(
      writeJsonAtomic(
        join(directory, 'data.json'),
        {},
        { rename: failingRename('ENOSPC', 1), sleep }
      )
    ).rejects.toBeInstanceOf(AppError)
    expect(sleep).not.toHaveBeenCalled()
  })
})

describe('readJsonIfExists', () => {
  it('returns undefined for a missing file', async () => {
    expect(await readJsonIfExists(join(directory, 'missing.json'))).toBeUndefined()
  })

  it('throws CORRUPT_FILE for invalid JSON after one retry', async () => {
    const path = join(directory, 'broken.json')
    await writeFile(path, '{ not json')
    const sleep = vi.fn().mockResolvedValue(undefined)
    await expect(readJsonIfExists(path, { sleep })).rejects.toMatchObject({
      code: 'CORRUPT_FILE'
    })
    expect(sleep).toHaveBeenCalledTimes(1)
  })
})
