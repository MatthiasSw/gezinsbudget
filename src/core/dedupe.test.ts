// Tests duplicate splitting.
import { describe, expect, it } from 'vitest'
import { splitDuplicates } from './dedupe'

describe('splitDuplicates', () => {
  it('puts known ids in duplicates and the rest in fresh, keeping order', () => {
    const incoming = [{ id: 'a' }, { id: 'b' }, { id: 'c' }]
    expect(splitDuplicates(incoming, new Set(['b']))).toEqual({
      fresh: [{ id: 'a' }, { id: 'c' }],
      duplicates: [{ id: 'b' }]
    })
  })

  it('treats everything as fresh when nothing exists yet', () => {
    expect(splitDuplicates([{ id: 'a' }], new Set()).fresh).toHaveLength(1)
  })

  it('treats everything as duplicate on a full re-import', () => {
    const incoming = [{ id: 'a' }, { id: 'b' }]
    const result = splitDuplicates(incoming, new Set(['a', 'b']))
    expect(result.fresh).toHaveLength(0)
    expect(result.duplicates).toHaveLength(2)
  })
})
