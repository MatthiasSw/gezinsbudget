// Tests token storage and expiry of pending imports.
import { describe, expect, it } from 'vitest'
import { createPendingImports } from './pendingImports'

describe('pending imports', () => {
  it('returns what was added under the token', () => {
    const pending = createPendingImports<string>()
    const token = pending.add('file')
    expect(pending.get(token)).toBe('file')
  })

  it('creates a different token for every entry', () => {
    const pending = createPendingImports<string>()
    expect(pending.add('a')).not.toBe(pending.add('a'))
  })

  it('rejects an unknown token', () => {
    expect(() => createPendingImports<string>().get('nope')).toThrow()
  })

  it('expires entries after the time to live', () => {
    let current = 0
    const pending = createPendingImports<string>({
      now: () => new Date(current),
      timeToLiveMs: 1000
    })
    const token = pending.add('file')
    current = 999
    expect(pending.get(token)).toBe('file')
    current = 1000
    expect(() => pending.get(token)).toThrow()
  })

  it('extends the lifetime when an entry is replaced', () => {
    let current = 0
    const pending = createPendingImports<string>({
      now: () => new Date(current),
      timeToLiveMs: 1000
    })
    const token = pending.add('old')
    current = 900
    pending.replace(token, 'new')
    current = 1500
    expect(pending.get(token)).toBe('new')
  })

  it('forgets removed entries', () => {
    const pending = createPendingImports<string>()
    const token = pending.add('file')
    pending.remove(token)
    expect(() => pending.get(token)).toThrow()
  })
})
