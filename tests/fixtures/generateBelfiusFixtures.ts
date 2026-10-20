// Generates fictional Belfius-style CSV fixtures with exact encoding, line endings and preamble.
import { writeFileSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'
import iconv from 'iconv-lite'

const outputDir = dirname(fileURLToPath(import.meta.url))
const ownAccountA = 'BE68 5390 0754 7034'
const ownAccountB = 'BE71 0961 2345 6769'
const employerIban = 'BE62 5100 0754 7061'
const shopIban = 'BE43 0689 9999 9501'
const cardText = 'KAART NR 1234 5678 9012 3456 - Test Gebruiker'

type RowFields = {
  account?: string
  booking: string
  valueDate?: string
  counterIban?: string
  name: string
  street?: string
  city?: string
  transaction: string
  amount: string
  bic?: string
  country?: string
  message?: string
}

type CardFields = {
  booking: string
  shortDate: string
  merchant: string
  city: string
  amount: string
  reference: string
  account?: string
}

type FileFields = {
  from: string
  to: string
  balance: string
  rows: string[]
}

const header = [
  'Rekening',
  'Boekingsdatum',
  'Rekeninguittrekselnummer',
  'Transactienummer',
  'Rekening tegenpartij',
  'Naam tegenpartij bevat',
  'Straat en nummer',
  'Postcode en gemeente',
  'Transactie',
  'Valutadatum',
  'Bedrag',
  'Devies',
  'BIC',
  'Landcode',
  'Mededelingen'
]

function buildRow(fields: RowFields): string {
  const {
    account = ownAccountA,
    booking,
    valueDate = booking,
    counterIban = '',
    name,
    street = '',
    city = '',
    transaction,
    amount,
    bic = '',
    country = city ? 'BE' : '',
    message = transaction
  } = fields
  return [
    account,
    booking,
    '',
    '',
    counterIban,
    name,
    street,
    city,
    transaction,
    valueDate,
    amount,
    'EUR',
    bic,
    country,
    message
  ].join(';')
}

function cardPayment(fields: CardFields): string {
  const { booking, shortDate, merchant, city, amount, reference, account } = fields
  const cents = amount.replace('-', '')
  const transaction = `DEBITMASTERCARD-BETALING ${shortDate} ${merchant} ${city} BE ${cents} EUR ${cardText} REF. : ${reference} VAL. ${shortDate.replace('/', '-')}`
  return buildRow({ account, booking, name: merchant, city: `9000 ${city}`, transaction, amount })
}

function buildFile({ from, to, balance, rows }: FileFields): string {
  const preamble = [
    `Boekingsdatum vanaf;${from}`,
    `Boekingsdatum tot en met;${to}`,
    'Bedrag vanaf;',
    'Bedrag tot en met;',
    'Rekeninguittrekselnummer vanaf;',
    'Rekeninguittrekselnummer tot en met;',
    'Mededeling;',
    'Naam tegenpartij bevat;',
    'Rekening tegenpartij;',
    `Laatste saldo;${balance} EUR`,
    `Datum/uur van het laatste saldo;${to} 10:00:00`,
    ';'
  ]
  return [...preamble, header.join(';'), ...rows].join('\r\n')
}

function save(name: string, content: string, encoding: string): void {
  writeFileSync(join(outputDir, name), iconv.encode(content, encoding))
}

const parkingA = cardPayment({
  booking: '18/01/2026',
  shortDate: '17/01',
  merchant: 'Parkeer Centrum',
  city: 'Gent',
  amount: '-2,50',
  reference: '0101A1A100001'
})

const basicRows = [
  cardPayment({
    booking: '28/01/2026',
    shortDate: '27/01',
    merchant: 'Supermarkt Groenhof',
    city: 'Gent',
    amount: '-45,30',
    reference: '0101A1A100002'
  }),
  cardPayment({
    booking: '27/01/2026',
    shortDate: '26/01',
    merchant: 'Café Zoë',
    city: 'Gent',
    amount: '-8,40',
    reference: '0101A1A100003'
  }),
  buildRow({
    booking: '26/01/2026',
    counterIban: employerIban,
    name: 'Zonnebloem NV',
    transaction: `STORTING VAN ${employerIban} Zonnebloem NV NAAR ${ownAccountA} Loon januari`,
    amount: '2345,67',
    bic: 'GEBABEBB',
    message: 'Loon januari'
  }),
  buildRow({
    booking: '20/01/2026',
    name: 'Boulangerie Éclair',
    city: '9000 Gent',
    transaction: 'BANCONTACT-AANKOOP - Boulangerie Éclair Gent BE 12,10 EUR',
    amount: '-12,10'
  }),
  buildRow({
    booking: '15/01/2026',
    counterIban: shopIban,
    name: 'Crèche Ïris',
    transaction: `OVERSCHRIJVING BELFIUS MOBILE NAAR ${shopIban} Crèche Ïris Opvang december`,
    amount: '-310,00',
    bic: 'GKCCBEBB',
    message: 'Opvang december'
  }),
  buildRow({
    booking: '10/01/2026',
    counterIban: 'BE62 5100 0754 7061',
    name: 'Jan Peeters',
    transaction: `INSTANT OVERSCHRIJVING BELFIUS MOBILE NAAR ${employerIban} Jan Peeters`,
    amount: '-25,00',
    bic: 'GEBABEBB',
    message: ''
  }),
  buildRow({
    booking: '05/01/2026',
    counterIban: shopIban,
    name: 'Energie Noord',
    transaction: `DOORLOPENDE BETALINGSOPDRACHT 12345678 NAAR ${shopIban} Energie Noord Voorschot energie`,
    amount: '-120,00',
    bic: 'KREDBEBB',
    message: 'Voorschot energie'
  }),
  buildRow({
    booking: '02/01/2026',
    valueDate: '01/01/2026',
    name: 'Garage Vermeulen',
    city: '9000 Gent',
    transaction: 'BANCONTACT-AANKOOP - Garage Vermeulen Gent BE 1234,56 EUR',
    amount: '-1234,56'
  })
]

const basic = buildFile({
  from: '01/01/2026',
  to: '31/01/2026',
  balance: '1.234,56',
  rows: basicRows
})
save('belfius-basic.csv', basic, 'win1252')
save('belfius-utf8.csv', basic, 'utf8')

const groceries = basicRows[0]
const salary = basicRows[2]
const bakery = basicRows[3]
const energy = basicRows[6]

save(
  'belfius-duplicates.csv',
  buildFile({
    from: '01/01/2026',
    to: '31/01/2026',
    balance: '100,00',
    rows: [parkingA, parkingA, groceries]
  }),
  'win1252'
)

save(
  'belfius-overlap-a.csv',
  buildFile({
    from: '01/01/2026',
    to: '20/01/2026',
    balance: '500,00',
    rows: [bakery, parkingA, parkingA, energy]
  }),
  'win1252'
)

save(
  'belfius-overlap-b.csv',
  buildFile({
    from: '15/01/2026',
    to: '31/01/2026',
    balance: '800,00',
    rows: [groceries, salary, bakery, parkingA, parkingA]
  }),
  'win1252'
)

const withoutAmount = buildFile({
  from: '01/01/2026',
  to: '31/01/2026',
  balance: '0,00',
  rows: [groceries]
})
  .split('\r\n')
  .map((line): string => {
    const cells = line.split(';')
    return cells.length === 15 ? cells.filter((_, index) => index !== 10).join(';') : line
  })
  .join('\r\n')
save('belfius-missing-column.csv', withoutAmount, 'win1252')

save('belfius-unknown-format.csv', 'kolomA;kolomB;kolomC\r\n1;2;3\r\n4;5;6', 'win1252')

const transferOut = buildRow({
  booking: '12/01/2026',
  counterIban: ownAccountB,
  name: 'Test Gebruiker',
  transaction: `OVERSCHRIJVING BELFIUS MOBILE NAAR ${ownAccountB} Test Gebruiker Spaarpot`,
  amount: '-200,00',
  bic: 'GKCCBEBB',
  message: 'Spaarpot'
})
const transferIn = buildRow({
  account: ownAccountB,
  booking: '12/01/2026',
  counterIban: ownAccountA,
  name: 'Test Gebruiker',
  transaction: `STORTING VAN ${ownAccountA} Test Gebruiker NAAR ${ownAccountB} Spaarpot`,
  amount: '200,00',
  bic: 'GKCCBEBB',
  message: 'Spaarpot'
})
save(
  'belfius-two-accounts.csv',
  buildFile({
    from: '01/01/2026',
    to: '31/01/2026',
    balance: '1.000,00',
    rows: [transferOut, transferIn, groceries]
  }),
  'win1252'
)

console.log('Fixtures written to', outputDir)
