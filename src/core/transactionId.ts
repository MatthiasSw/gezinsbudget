// Builds stable transaction ids so re-imports never duplicate, while identical rows stay distinct.
import { createHash } from 'crypto'
import { normalizeIban } from '@shared/iban'

const fieldSeparator = '\u001f'
const idLength = 24

export type IdentifiableRow = {
  accountId: string
  bookingDate: string
  amountCents: number
  counterpartyIban?: string
  counterpartyName?: string
  message?: string
  statementNumber?: string
  transactionNumber?: string
  description?: string
}

export function assignTransactionIds(rows: IdentifiableRow[]): string[] {
  const occurrencesByHash = new Map<string, number>()

  return rows.map((row) => {
    const baseHash = hashRow(row)
    const occurrence = occurrencesByHash.get(baseHash) ?? 0
    occurrencesByHash.set(baseHash, occurrence + 1)
    return sha256(`${baseHash}#${occurrence}`).slice(0, idLength)
  })
}

function hashRow(row: IdentifiableRow): string {
  const fields = [
    normalizeIban(row.accountId),
    row.bookingDate,
    String(row.amountCents),
    normalizeIban(row.counterpartyIban),
    normalizeText(row.counterpartyName),
    normalizeText(row.message),
    normalizeText(row.statementNumber),
    normalizeText(row.transactionNumber),
    normalizeText(row.description)
  ]
  return sha256(fields.join(fieldSeparator))
}

function normalizeText(text: string | undefined): string {
  return (text ?? '').normalize('NFC').trim().replace(/\s+/g, ' ')
}

function sha256(text: string): string {
  return createHash('sha256').update(text).digest('hex')
}
