// Tests the Belfius parser against the fictional fixtures and malformed inputs.
import iconv from 'iconv-lite'
import { readFileSync } from 'fs'
import { join } from 'path'
import { describe, expect, it } from 'vitest'
import { assignTransactionIds } from '../transactionId'
import { parseImportFile } from './parseImportFile'

const fixturesDir = join(__dirname, '../../../tests/fixtures')

function readFixture(name: string): Buffer {
  return readFileSync(join(fixturesDir, name))
}

function parseText(text: string): ReturnType<typeof parseImportFile> {
  return parseImportFile(iconv.encode(text, 'win1252'))
}

function expectError(action: () => unknown, code: string): unknown {
  try {
    action()
  } catch (error) {
    expect(error).toMatchObject({ code })
    return (error as { details?: unknown }).details
  }
  throw new Error(`Expected error ${code}`)
}

describe('belfius fixtures', () => {
  const result = parseImportFile(readFixture('belfius-basic.csv'))

  it('detects the profile and the Windows-1252 encoding', () => {
    expect(result.profileId).toBe('belfius')
    expect(result.encoding).toBe('windows-1252')
  })

  it('reads every data row and skips the preamble', () => {
    expect(result.rows).toHaveLength(8)
  })

  it('normalizes the account and converts dates and amounts', () => {
    expect(result.rows[0]).toMatchObject({
      accountId: 'BE68539007547034',
      bookingDate: '2026-01-28',
      valueDate: '2026-01-28',
      amountCents: -4530,
      currency: 'EUR',
      counterpartyName: 'Supermarkt Groenhof'
    })
  })

  it('reads amounts without thousands separator and positive amounts', () => {
    const amounts = result.rows.map((row) => row.amountCents)
    expect(amounts).toContain(-123456)
    expect(amounts).toContain(234567)
  })

  it('keeps a value date that differs from the booking date', () => {
    const garage = result.rows.find((row) => row.counterpartyName === 'Garage Vermeulen')
    expect(garage).toMatchObject({ bookingDate: '2026-01-02', valueDate: '2026-01-01' })
  })

  it('reads accented text correctly from Windows-1252', () => {
    const names = result.rows.map((row) => row.counterpartyName)
    expect(names).toContain('Café Zoë')
    expect(names).toContain('Boulangerie Éclair')
    expect(names).toContain('Crèche Ïris')
  })

  it('splits counterparty IBAN, message and bank description', () => {
    const salary = result.rows.find((row) => row.counterpartyName === 'Zonnebloem NV')
    expect(salary).toMatchObject({
      counterpartyIban: 'BE62510007547061',
      message: 'Loon januari'
    })
    expect(salary?.description).toContain('STORTING VAN')
  })

  it('leaves empty fields undefined', () => {
    const instant = result.rows.find((row) => row.counterpartyName === 'Jan Peeters')
    expect(instant?.message).toBeUndefined()
    expect(instant?.statementNumber).toBeUndefined()
    expect(instant?.transactionNumber).toBeUndefined()
  })

  it('gives the same rows for the UTF-8 version of the file', () => {
    const utf8 = parseImportFile(readFixture('belfius-utf8.csv'))
    expect(utf8.encoding).toBe('utf-8')
    expect(utf8.rows).toEqual(result.rows)
  })

  it('reads two accounts from one file', () => {
    const rows = parseImportFile(readFixture('belfius-two-accounts.csv')).rows
    expect(new Set(rows.map((row) => row.accountId)).size).toBe(2)
  })

  it('keeps identical rows as separate rows with distinct ids', () => {
    const rows = parseImportFile(readFixture('belfius-duplicates.csv')).rows
    expect(rows).toHaveLength(3)
    const ids = assignTransactionIds(rows)
    expect(new Set(ids).size).toBe(3)
  })

  it('gives the shared rows of overlapping files the same ids', () => {
    const idsA = assignTransactionIds(parseImportFile(readFixture('belfius-overlap-a.csv')).rows)
    const idsB = assignTransactionIds(parseImportFile(readFixture('belfius-overlap-b.csv')).rows)
    const knownIds = new Set(idsA)
    const sharedFromB = idsB.filter((id) => knownIds.has(id))
    const newFromB = idsB.filter((id) => !knownIds.has(id))
    expect(sharedFromB).toHaveLength(3)
    expect(newFromB).toHaveLength(2)
  })
})

describe('rejected files', () => {
  it('reports an unknown format', () => {
    expectError(
      () => parseImportFile(readFixture('belfius-unknown-format.csv')),
      'IMPORT_FORMAT_UNKNOWN'
    )
  })

  it('reports an empty file as unknown format', () => {
    expectError(() => parseImportFile(new Uint8Array()), 'IMPORT_FORMAT_UNKNOWN')
  })

  it('names the missing columns', () => {
    const details = expectError(
      () => parseImportFile(readFixture('belfius-missing-column.csv')),
      'IMPORT_MISSING_COLUMNS'
    )
    expect(details).toEqual({ missing: ['Bedrag'] })
  })
})

describe('malformed rows', () => {
  const header =
    'Rekening;Boekingsdatum;Rekeninguittrekselnummer;Transactienummer;Rekening tegenpartij;Naam tegenpartij bevat;Straat en nummer;Postcode en gemeente;Transactie;Valutadatum;Bedrag;Devies;BIC;Landcode;Mededelingen'
  const goodRow =
    'BE68 5390 0754 7034;05/01/2026;;;;Winkel;;;Aankoop;05/01/2026;-5,00;EUR;;;Aankoop'

  function build(...rows: string[]): string {
    return ['Boekingsdatum vanaf;01/01/2026', ';', header, ...rows].join('\r\n')
  }

  it('accepts a minimal valid file', () => {
    expect(parseText(build(goodRow)).rows).toHaveLength(1)
  })

  it('rejects the whole file when one date is invalid and reports its line', () => {
    const badDate = goodRow.replace('05/01/2026;;', '31/02/2026;;')
    const details = expectError(
      () => parseText(build(goodRow, badDate, goodRow)),
      'IMPORT_PARSE_ERROR'
    )
    expect(details).toMatchObject({ totalErrors: 1, errors: [{ line: 5 }] })
  })

  it('rejects an invalid amount', () => {
    const badAmount = goodRow.replace('-5,00', '5,000')
    expectError(() => parseText(build(badAmount)), 'IMPORT_PARSE_ERROR')
  })

  it('rejects a row with a missing account', () => {
    expectError(
      () => parseText(build(goodRow.replace('BE68 5390 0754 7034', ''))),
      'IMPORT_PARSE_ERROR'
    )
  })

  it('rejects a row with too few fields', () => {
    expectError(
      () => parseText(build(goodRow, 'BE68 5390 0754 7034;05/01/2026')),
      'IMPORT_PARSE_ERROR'
    )
  })

  it('reports at most 20 errors but counts all of them', () => {
    const badRow = goodRow.replace('-5,00', 'x')
    const details = expectError(
      () => parseText(build(...Array.from({ length: 30 }, () => badRow))),
      'IMPORT_PARSE_ERROR'
    ) as { errors: unknown[]; totalErrors: number }
    expect(details.errors).toHaveLength(20)
    expect(details.totalErrors).toBe(30)
  })

  it('ignores blank lines at the end of the file', () => {
    expect(parseText(`${build(goodRow)}\r\n\r\n`).rows).toHaveLength(1)
  })

  it('accepts LF line endings', () => {
    expect(parseText(build(goodRow).replace(/\r\n/g, '\n')).rows).toHaveLength(1)
  })
})
