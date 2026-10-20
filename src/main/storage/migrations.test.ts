// Tests schema migration and refusal of newer schema versions.
import { describe, expect, it } from 'vitest'
import { currentSchemaVersions, migrateToCurrent } from './migrations'

const versions = { ...currentSchemaVersions, rules: 3 }

describe('migrateToCurrent', () => {
  it('returns data unchanged when already current', () => {
    expect(migrateToCurrent('settings', 'settings.json', 1, { a: 1 })).toEqual({ a: 1 })
  })

  it('applies migrations in order', () => {
    const registry = {
      rules: {
        1: (data: unknown) => [...(data as string[]), 'v2'],
        2: (data: unknown) => [...(data as string[]), 'v3']
      }
    }
    expect(migrateToCurrent('rules', 'rules.json', 1, [], registry, versions)).toEqual(['v2', 'v3'])
  })

  it('rejects a newer schema version', () => {
    expect(() => migrateToCurrent('settings', 'settings.json', 2, {})).toThrowError(
      expect.objectContaining({ code: 'UNSUPPORTED_SCHEMA' })
    )
  })

  it('rejects a missing migration step', () => {
    expect(() => migrateToCurrent('rules', 'rules.json', 1, [], {}, versions)).toThrowError(
      expect.objectContaining({ code: 'CORRUPT_FILE' })
    )
  })

  it.each([0, -1, 1.5, 'one', undefined, null])('rejects invalid schemaVersion %s', (value) => {
    expect(() => migrateToCurrent('settings', 'settings.json', value, {})).toThrowError(
      expect.objectContaining({ code: 'CORRUPT_FILE' })
    )
  })
})
