// Tests that axis bounds and ticks come out as round numbers.
import { describe, expect, it } from 'vitest'
import { niceAxis } from './chartScale'

describe('niceAxis', () => {
  it('rounds the top up to a clean step and starts at zero', () => {
    const axis = niceAxis(0, 260000)
    expect(axis.domain).toEqual([0, 300000])
    expect(axis.ticks).toEqual([0, 100000, 200000, 300000])
  })

  it('keeps the baseline at zero for positive data', () => {
    expect(niceAxis(5000, 12000).domain[0]).toBe(0)
  })

  it('includes negative values', () => {
    const axis = niceAxis(-45000, 120000)
    expect(axis.domain[0]).toBeLessThanOrEqual(-45000)
    expect(axis.domain[1]).toBeGreaterThanOrEqual(120000)
    expect(axis.ticks).toContain(0)
  })

  it('handles an empty range', () => {
    expect(niceAxis(0, 0).ticks.length).toBeGreaterThan(1)
  })
})
