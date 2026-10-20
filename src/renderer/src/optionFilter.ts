// Filters dropdown options on what the user typed, ignoring case and accents.
import { normalizeText } from '@shared/text'

export type SearchOption = {
  id: string
  label: string
  name: string
  hint?: string
}

export function filterOptions(options: SearchOption[], query: string): SearchOption[] {
  const words = normalizeText(query).split(/\s+/).filter(Boolean)
  if (words.length === 0) return options
  return options.filter((option) => {
    const haystack = normalizeText(`${option.name} ${option.hint ?? ''}`)
    return words.every((word) => haystack.includes(word))
  })
}
