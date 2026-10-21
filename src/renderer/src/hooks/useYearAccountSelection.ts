// The year and account chosen on the overview, charts and insights pages.
// The main screen keeps it, so a page still has its choice when you come back to it from the transactions.
import { useState } from 'react'

export type YearAccountSelection = {
  chosenYear: number | null
  accountId: string
  setChosenYear: (year: number) => void
  setAccountId: (accountId: string) => void
}

export function useYearAccountSelection(): YearAccountSelection {
  const [chosenYear, setChosenYear] = useState<number | null>(null)
  const [accountId, setAccountId] = useState('')
  return { chosenYear, accountId, setChosenYear, setAccountId }
}
