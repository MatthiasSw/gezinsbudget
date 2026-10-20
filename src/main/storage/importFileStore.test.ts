// Tests storing imported files: naming, byte-exactness and deduplication by content.
import { mkdtemp, readdir, readFile, rm } from 'fs/promises'
import { tmpdir } from 'os'
import { join } from 'path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { storeImportFile } from './importFileStore'

let importsDir: string
const firstMoment = (): Date => new Date('2026-01-05T10:00:00.000Z')
const laterMoment = (): Date => new Date('2026-02-01T08:30:15.000Z')

beforeEach(async () => {
  importsDir = join(await mkdtemp(join(tmpdir(), 'imports-')), 'imports')
})

afterEach(async () => {
  await rm(join(importsDir, '..'), { recursive: true, force: true })
})

describe('storeImportFile', () => {
  it('stores the file byte-for-byte under a timestamped name', async () => {
    const content = Buffer.from([0x41, 0xe9, 0x0d, 0x0a, 0x00, 0xff])
    const name = await storeImportFile(importsDir, 'export.csv', content, firstMoment)
    expect(name).toBe('20260105-100000_export.csv')
    expect(await readFile(join(importsDir, name))).toEqual(content)
  })

  it('reuses the stored file when the same content is imported again', async () => {
    const content = Buffer.from('a;b;c')
    const first = await storeImportFile(importsDir, 'export.csv', content, firstMoment)
    const second = await storeImportFile(importsDir, 'renamed.csv', content, laterMoment)
    expect(second).toBe(first)
    expect(await readdir(importsDir)).toEqual([first])
  })

  it('stores different content with the same name as a separate file', async () => {
    const first = await storeImportFile(importsDir, 'export.csv', Buffer.from('one'), firstMoment)
    const second = await storeImportFile(importsDir, 'export.csv', Buffer.from('two'), laterMoment)
    expect(second).not.toBe(first)
    expect(await readdir(importsDir)).toHaveLength(2)
  })

  it('removes path parts and unsafe characters from the original name', async () => {
    const name = await storeImportFile(
      importsDir,
      'C:/some/dir/bad:name?.csv',
      Buffer.from('x'),
      firstMoment
    )
    expect(name).toBe('20260105-100000_bad_name_.csv')
  })

  it('falls back to a default name when nothing usable remains', async () => {
    const name = await storeImportFile(importsDir, '   ', Buffer.from('x'), firstMoment)
    expect(name).toBe('20260105-100000_import.csv')
  })
})
