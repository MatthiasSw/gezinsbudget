// Detects whether a CSV file is UTF-8 or Windows-1252 and decodes it to text.
import iconv from 'iconv-lite'

export type DetectedEncoding = 'utf-8' | 'windows-1252'

export type DecodedText = {
  text: string
  encoding: DetectedEncoding
}

const utf8Bom = [0xef, 0xbb, 0xbf]

export function decodeBuffer(buffer: Uint8Array): DecodedText {
  if (hasUtf8Bom(buffer)) {
    return {
      text: new TextDecoder('utf-8').decode(buffer.subarray(utf8Bom.length)),
      encoding: 'utf-8'
    }
  }
  const utf8Text = tryDecodeUtf8(buffer)
  if (utf8Text !== undefined) return { text: utf8Text, encoding: 'utf-8' }
  return { text: iconv.decode(Buffer.from(buffer), 'windows-1252'), encoding: 'windows-1252' }
}

function hasUtf8Bom(buffer: Uint8Array): boolean {
  return utf8Bom.every((byte, index) => buffer[index] === byte)
}

function tryDecodeUtf8(buffer: Uint8Array): string | undefined {
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(buffer)
  } catch {
    return undefined
  }
}
