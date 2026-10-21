// Rewrites stored month files with a transformation and counts how many transactions it changed.
import type { Transaction } from '@shared/types'
import type { DataRepository } from '../storage/repository'

// Must return the same object for every transaction it leaves unchanged; that is how changes are counted.
export type MonthTransform = (stored: Transaction[], month: string) => Transaction[]

export type RewriteOptions = {
  dryRun?: boolean
}

export async function rewriteMonths(
  repository: DataRepository,
  months: string[],
  transform: MonthTransform,
  { dryRun = false }: RewriteOptions = {}
): Promise<number> {
  let changedCount = 0
  for (const month of months) {
    const stored = await repository.getMonth(month)
    const next = transform(stored, month)
    const changed = next.filter((transaction, index) => transaction !== stored[index]).length
    if (changed === 0) continue
    changedCount += changed
    if (!dryRun) await repository.saveMonth(month, next)
  }
  return changedCount
}
