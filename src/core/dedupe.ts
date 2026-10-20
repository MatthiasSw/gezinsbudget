// Splits incoming items into new ones and ones whose id is already known.
export type DuplicateSplit<T> = {
  fresh: T[]
  duplicates: T[]
}

export function splitDuplicates<T extends { id: string }>(
  incoming: T[],
  existingIds: ReadonlySet<string>
): DuplicateSplit<T> {
  const fresh: T[] = []
  const duplicates: T[] = []
  for (const item of incoming) {
    if (existingIds.has(item.id)) duplicates.push(item)
    else fresh.push(item)
  }
  return { fresh, duplicates }
}
