// Tests that handler errors become typed results and unexpected details stay hidden.
import { describe, expect, it } from 'vitest'
import { AppError } from '@shared/errors'
import { toResultHandler } from './resultHandler'

describe('toResultHandler', () => {
  it('returns the handler value on success', async () => {
    const handle = toResultHandler<'settings:get'>(async () => ({ accounts: [] }))
    expect(await handle()).toEqual({ ok: true, value: { accounts: [] } })
  })

  it('serializes application errors', async () => {
    const handle = toResultHandler<'settings:get'>(async () => {
      throw new AppError('CORRUPT_FILE', 'bad file')
    })
    expect(await handle()).toEqual({
      ok: false,
      error: { code: 'CORRUPT_FILE', message: 'bad file', details: undefined }
    })
  })

  it('hides details of unexpected errors', async () => {
    const handle = toResultHandler<'settings:get'>(async () => {
      throw new Error('C:/secret/path failed')
    })
    expect(await handle()).toEqual({
      ok: false,
      error: { code: 'UNKNOWN', message: 'Unexpected error' }
    })
  })
})
