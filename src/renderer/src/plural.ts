// Picks the Dutch singular or plural form for a count, for example "1 transactie" or "3 transacties".
export function pluralWord(count: number, one: string, many: string): string {
  return count === 1 ? one : many
}

export function pluralize(count: number, one: string, many: string): string {
  return `${count} ${pluralWord(count, one, many)}`
}

export function transactionCount(count: number): string {
  return pluralize(count, 'transactie', 'transacties')
}
