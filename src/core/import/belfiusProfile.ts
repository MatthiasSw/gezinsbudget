// Import profile for Belfius CSV exports (semicolon separated, preamble before the header).
import { parseBelgianDate } from '@shared/dates'
import { parseAmountToCents } from '@shared/money'
import type { ImportProfile } from './profile'

const headerStart = 'Rekening;Boekingsdatum'

export const belfiusProfile: ImportProfile = {
  id: 'belfius',
  label: 'Belfius',
  delimiter: ';',
  isHeaderLine: (line) => line.startsWith(headerStart),
  columns: {
    account: 'Rekening',
    bookingDate: 'Boekingsdatum',
    valueDate: 'Valutadatum',
    statementNumber: 'Rekeninguittrekselnummer',
    transactionNumber: 'Transactienummer',
    counterpartyIban: 'Rekening tegenpartij',
    counterpartyName: 'Naam tegenpartij bevat',
    description: 'Transactie',
    message: 'Mededelingen',
    amount: 'Bedrag',
    currency: 'Devies'
  },
  parseDate: parseBelgianDate,
  parseAmount: parseAmountToCents
}
