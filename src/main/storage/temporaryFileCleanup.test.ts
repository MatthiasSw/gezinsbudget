// Tests that only old temporary files are removed.
import { mkdtemp, readdir, rm, utimes, writeFile } from 'fs/promises'
import { tmpdir } from 'os'
import { join } from 'path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { removeStaleTemporaryFiles } from './temporaryFileCleanup'

let directory: string
const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000)

beforeEach(async () => {
  directory = await mkdtemp(join(tmpdir(), 'cleanup-'))
})

afterEach(async () => {
  await rm(directory, { recursive: true, force: true })
})

describe('removeStaleTemporaryFiles', () => {
  it('removes temporary files older than the maximum age', async () => {
    const stale = join(directory, '.data.json.1.abcd.tmp')
    await writeFile(stale, 'x')
    await utimes(stale, twoHoursAgo, twoHoursAgo)

    await removeStaleTemporaryFiles(directory)
    expect(await readdir(directory)).toEqual([])
  })

  it('keeps recent temporary files', async () => {
    await writeFile(join(directory, '.data.json.1.abcd.tmp'), 'x')
    await removeStaleTemporaryFiles(directory)
    expect(await readdir(directory)).toHaveLength(1)
  })

  it('keeps regular data files, even old ones', async () => {
    const data = join(directory, 'data.json')
    await writeFile(data, '{}')
    await utimes(data, twoHoursAgo, twoHoursAgo)

    await removeStaleTemporaryFiles(directory)
    expect(await readdir(directory)).toEqual(['data.json'])
  })

  it('ignores a folder that does not exist', async () => {
    await expect(removeStaleTemporaryFiles(join(directory, 'missing'))).resolves.toBeUndefined()
  })
})
