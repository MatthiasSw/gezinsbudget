// Tests the data version counter.
import { mkdtemp, rm } from 'fs/promises'
import { tmpdir } from 'os'
import { join } from 'path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { bumpDataVersion, readDataVersion } from './dataVersion'

let directory: string
let filePath: string
const fixedNow = (): Date => new Date('2026-01-05T10:00:00.000Z')

beforeEach(async () => {
  directory = await mkdtemp(join(tmpdir(), 'dataversion-'))
  filePath = join(directory, 'data-version.json')
})

afterEach(async () => {
  await rm(directory, { recursive: true, force: true })
})

describe('data version', () => {
  it('is undefined before the first bump', async () => {
    expect(await readDataVersion(filePath)).toBeUndefined()
  })

  it('starts at 1 and increases with every bump', async () => {
    expect((await bumpDataVersion(filePath, 'pc-a', fixedNow)).counter).toBe(1)
    expect((await bumpDataVersion(filePath, 'pc-a', fixedNow)).counter).toBe(2)
  })

  it('records who changed the data and when', async () => {
    await bumpDataVersion(filePath, 'pc-a', fixedNow)
    expect(await readDataVersion(filePath)).toEqual({
      counter: 1,
      updatedAt: '2026-01-05T10:00:00.000Z',
      updatedBy: 'pc-a'
    })
  })
})
