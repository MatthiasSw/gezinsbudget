// Tests path building and month key validation.
import { describe, expect, it } from 'vitest'
import { join } from 'path'
import { createDataPaths, monthKeyFromFileName } from './dataPaths'

describe('createDataPaths', () => {
  it('places month files in the transactions folder', () => {
    const paths = createDataPaths('/data')
    expect(paths.monthFile('2026-01')).toBe(join('/data', 'transactions', '2026-01.json'))
  })

  it.each(['2026-1', '2026-13', '2026-00', 'abcd-01', '../2026-01', ''])(
    'rejects invalid month key %s',
    (monthKey) => {
      expect(() => createDataPaths('/data').monthFile(monthKey)).toThrow()
    }
  )
})

describe('monthKeyFromFileName', () => {
  it('extracts the month from a valid file name', () => {
    expect(monthKeyFromFileName('2026-02.json')).toBe('2026-02')
  })

  it.each(['2026-02 (Conflict 1).json', '.2026-02.json.tmp', '2026-02.json.bak', 'notes.json'])(
    'ignores %s',
    (fileName) => {
      expect(monthKeyFromFileName(fileName)).toBeUndefined()
    }
  )
})
