// Tests the schemaVersion envelope: roundtrip, fallback, newer versions and corruption.
import { mkdtemp, readFile, rm, writeFile } from 'fs/promises'
import { tmpdir } from 'os'
import { join } from 'path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { readVersionedFile, writeVersionedFile } from './versionedFile'

let directory: string
let filePath: string

beforeEach(async () => {
  directory = await mkdtemp(join(tmpdir(), 'versioned-'))
  filePath = join(directory, 'categories.json')
})

afterEach(async () => {
  await rm(directory, { recursive: true, force: true })
})

describe('versioned files', () => {
  it('roundtrips data inside an envelope', async () => {
    await writeVersionedFile(filePath, 'categories', [{ id: 'a' }])
    const raw = JSON.parse(await readFile(filePath, 'utf-8'))
    expect(raw).toEqual({ schemaVersion: 1, data: [{ id: 'a' }] })
    expect(await readVersionedFile(filePath, 'categories', () => [])).toEqual([{ id: 'a' }])
  })

  it('returns the fallback when the file does not exist', async () => {
    expect(await readVersionedFile(filePath, 'categories', () => ['fallback'])).toEqual([
      'fallback'
    ])
  })

  it('refuses to read a newer schema version', async () => {
    await writeFile(filePath, JSON.stringify({ schemaVersion: 2, data: [] }))
    await expect(readVersionedFile(filePath, 'categories', () => [])).rejects.toMatchObject({
      code: 'UNSUPPORTED_SCHEMA'
    })
  })

  it('refuses to overwrite a newer file and leaves it untouched', async () => {
    const original = JSON.stringify({ schemaVersion: 2, data: ['future'] })
    await writeFile(filePath, original)
    await expect(writeVersionedFile(filePath, 'categories', [])).rejects.toMatchObject({
      code: 'UNSUPPORTED_SCHEMA'
    })
    expect(await readFile(filePath, 'utf-8')).toBe(original)
  })

  it('reports a file without envelope as corrupt', async () => {
    await writeFile(filePath, JSON.stringify([1, 2, 3]))
    await expect(readVersionedFile(filePath, 'categories', () => [])).rejects.toMatchObject({
      code: 'CORRUPT_FILE'
    })
  })

  it('allows overwriting a corrupt file to recover', async () => {
    await writeFile(filePath, '{ broken')
    await writeVersionedFile(filePath, 'categories', ['fresh'])
    expect(await readVersionedFile(filePath, 'categories', () => [])).toEqual(['fresh'])
  })
})
