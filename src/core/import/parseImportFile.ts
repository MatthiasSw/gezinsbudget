// Turns a bank export file into parsed rows, or rejects the whole file with clear errors.
import Papa from 'papaparse'
import { AppError } from '@shared/errors'
import { normalizeIban } from '@shared/iban'
import { belfiusProfile } from './belfiusProfile'
import { decodeBuffer, type DetectedEncoding } from './encoding'
import type { ImportProfile, ParsedRow, RawFieldName } from './profile'

const maxReportedErrors = 20
const ibanPattern = /^[A-Z]{2}\d{2}[A-Z0-9]{10,30}$/

export type LineError = {
  line: number
  message: string
}

export type ParseResult = {
  profileId: string
  profileLabel: string
  encoding: DetectedEncoding
  rows: ParsedRow[]
}

type MatchedProfile = {
  profile: ImportProfile
  headerIndex: number
}

type RawRecord = Record<string, string>

export function parseImportFile(
  buffer: Uint8Array,
  profiles: ImportProfile[] = [belfiusProfile]
): ParseResult {
  const { text, encoding } = decodeBuffer(buffer)
  const lines = text.split(/\r\n|\n|\r/)
  const match = findProfile(lines, profiles)
  if (!match) throw new AppError('IMPORT_FORMAT_UNKNOWN', 'This file format is not recognised')

  const table = readTable(lines, match)
  assertRequiredColumns(match.profile, table.header)
  const rows = mapRecords(match, table.records)
  return { profileId: match.profile.id, profileLabel: match.profile.label, encoding, rows }
}

function findProfile(lines: string[], profiles: ImportProfile[]): MatchedProfile | undefined {
  for (const profile of profiles) {
    const headerIndex = lines.findIndex((line) => profile.isHeaderLine(line))
    if (headerIndex !== -1) return { profile, headerIndex }
  }
  return undefined
}

function readTable(
  lines: string[],
  { profile, headerIndex }: MatchedProfile
): { header: string[]; records: RawRecord[] } {
  const result = Papa.parse<RawRecord>(lines.slice(headerIndex).join('\n'), {
    header: true,
    delimiter: profile.delimiter,
    skipEmptyLines: 'greedy',
    transformHeader: (name) => name.trim()
  })

  const errors = result.errors.map((error) => ({
    line: headerIndex + 2 + (error.row ?? 0),
    message: error.message
  }))
  throwIfAny(errors)
  return { header: result.meta.fields ?? [], records: result.data }
}

function assertRequiredColumns(profile: ImportProfile, header: string[]): void {
  const missing = Object.values(profile.columns).filter((column) => !header.includes(column))
  if (missing.length > 0) {
    throw new AppError('IMPORT_MISSING_COLUMNS', `Missing columns: ${missing.join(', ')}`, {
      missing
    })
  }
}

function mapRecords({ profile, headerIndex }: MatchedProfile, records: RawRecord[]): ParsedRow[] {
  const rows: ParsedRow[] = []
  const errors: LineError[] = []

  records.forEach((record, index) => {
    const line = headerIndex + 2 + index
    try {
      rows.push(mapRecord(profile, record))
    } catch (error) {
      errors.push({ line, message: error instanceof Error ? error.message : 'Unreadable row' })
    }
  })

  throwIfAny(errors)
  return rows
}

function mapRecord(profile: ImportProfile, record: RawRecord): ParsedRow {
  const field = (name: RawFieldName): string => (record[profile.columns[name]] ?? '').trim()
  const optional = (name: RawFieldName): string | undefined => field(name) || undefined

  const accountId = normalizeIban(field('account'))
  if (!ibanPattern.test(accountId)) throw new Error('Own account number is missing or invalid')

  const currency = field('currency').toUpperCase()
  if (currency === '') throw new Error('Currency is missing')

  const valueDate = optional('valueDate')
  return {
    accountId,
    bookingDate: profile.parseDate(field('bookingDate')),
    valueDate: valueDate ? profile.parseDate(valueDate) : undefined,
    amountCents: profile.parseAmount(field('amount')),
    currency,
    counterpartyIban: optionalIban(optional('counterpartyIban')),
    counterpartyName: optional('counterpartyName'),
    message: optional('message'),
    description: optional('description'),
    statementNumber: optional('statementNumber'),
    transactionNumber: optional('transactionNumber')
  }
}

function optionalIban(iban: string | undefined): string | undefined {
  return iban ? normalizeIban(iban) : undefined
}

function throwIfAny(errors: LineError[]): void {
  if (errors.length === 0) return
  const reported = errors.slice(0, maxReportedErrors)
  throw new AppError('IMPORT_PARSE_ERROR', `${errors.length} row(s) could not be read`, {
    errors: reported,
    totalErrors: errors.length
  })
}
