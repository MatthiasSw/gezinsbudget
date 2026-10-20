// Turns transactions into a semicolon-separated CSV that Excel opens correctly in Belgium.
import { formatBelgianDate } from '@shared/dates'
import { formatCentsPlain } from '@shared/money'
import type { Account, Category, Transaction } from '@shared/types'

const byteOrderMark = '﻿'
const separator = ';'
const lineBreak = '\r\n'
const header = [
  'Datum',
  'Rekening',
  'Tegenpartij',
  'IBAN tegenpartij',
  'Mededeling',
  'Bedrag',
  'Categorie',
  'Interne overboeking'
]
const formulaStarts = ['=', '+', '-', '@', '\t', '\r']

export function buildTransactionsCsv(
  transactions: Transaction[],
  accounts: Account[],
  categories: Category[]
): string {
  const accountNames = new Map(accounts.map((account) => [account.iban, account.name]))
  const categoriesById = new Map(categories.map((category) => [category.id, category]))

  const rows = transactions.map((transaction) => [
    formatBelgianDate(transaction.bookingDate),
    textCell(accountNames.get(transaction.accountId) ?? transaction.accountId),
    textCell(transaction.counterpartyName ?? ''),
    textCell(transaction.counterpartyIban ?? ''),
    textCell(transaction.message ?? ''),
    formatCentsPlain(transaction.amountCents),
    textCell(categoryPath(transaction.categoryId, categoriesById)),
    transaction.isInternalTransfer ? 'Ja' : 'Nee'
  ])

  return (
    byteOrderMark +
    [header, ...rows].map((row) => row.map(quote).join(separator)).join(lineBreak) +
    lineBreak
  )
}

function categoryPath(
  categoryId: string | undefined,
  categoriesById: Map<string, Category>
): string {
  const category = categoryId === undefined ? undefined : categoriesById.get(categoryId)
  if (!category) return ''
  const parent = category.parentId === undefined ? undefined : categoriesById.get(category.parentId)
  return parent ? `${parent.name} > ${category.name}` : category.name
}

function textCell(text: string): string {
  return formulaStarts.some((start) => text.startsWith(start)) ? `'${text}` : text
}

function quote(value: string): string {
  const needsQuotes = /[;"\r\n]/.test(value)
  return needsQuotes ? `"${value.replace(/"/g, '""')}"` : value
}
