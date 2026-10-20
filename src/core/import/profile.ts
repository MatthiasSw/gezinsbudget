// Describes a bank export format so new formats can be added without touching the parser.
import type { IdentifiableRow } from '../transactionId'

export type RawFieldName =
  | 'account'
  | 'bookingDate'
  | 'valueDate'
  | 'statementNumber'
  | 'transactionNumber'
  | 'counterpartyIban'
  | 'counterpartyName'
  | 'description'
  | 'message'
  | 'amount'
  | 'currency'

export type ImportProfile = {
  id: string
  label: string
  delimiter: string
  isHeaderLine(line: string): boolean
  columns: Record<RawFieldName, string>
  parseDate(text: string): string
  parseAmount(text: string): number
}

export type ParsedRow = IdentifiableRow & {
  valueDate?: string
  currency: string
}
