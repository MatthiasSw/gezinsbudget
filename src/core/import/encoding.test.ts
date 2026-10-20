// Tests encoding detection with accented characters.
import iconv from 'iconv-lite'
import { describe, expect, it } from 'vitest'
import { decodeBuffer } from './encoding'

const accented = 'Café Zoë Ïris'

describe('decodeBuffer', () => {
  it('decodes plain ASCII as UTF-8', () => {
    expect(decodeBuffer(Buffer.from('abc;123', 'utf-8'))).toEqual({
      text: 'abc;123',
      encoding: 'utf-8'
    })
  })

  it('decodes valid UTF-8 with accents', () => {
    expect(decodeBuffer(Buffer.from(accented, 'utf-8'))).toEqual({
      text: accented,
      encoding: 'utf-8'
    })
  })

  it('decodes Windows-1252 bytes that are not valid UTF-8', () => {
    expect(decodeBuffer(iconv.encode(accented, 'win1252'))).toEqual({
      text: accented,
      encoding: 'windows-1252'
    })
  })

  it('strips a UTF-8 byte order mark', () => {
    const withBom = Buffer.concat([Buffer.from([0xef, 0xbb, 0xbf]), Buffer.from(accented, 'utf-8')])
    expect(decodeBuffer(withBom)).toEqual({ text: accented, encoding: 'utf-8' })
  })

  it('handles an empty file', () => {
    expect(decodeBuffer(new Uint8Array())).toEqual({ text: '', encoding: 'utf-8' })
  })
})
