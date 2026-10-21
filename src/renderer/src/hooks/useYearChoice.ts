// Loads the years that have transactions and turns the chosen year into the year to show.
import { api } from '../api'
import { selectedYear, yearOptions } from '../yearChoice'
import { useAsyncData } from './useAsyncData'
import type { YearAccountSelection } from './useYearAccountSelection'

export function useYearChoice(
  dataRevision: number,
  { chosenYear, setChosenYear }: YearAccountSelection
): {
  year: number
  years: number[]
  setYear: (year: number) => void
} {
  const { state } = useAsyncData(api.overview.years, dataRevision)
  const currentYear = new Date().getFullYear()
  const yearsWithData = state.status === 'ready' ? state.data : []

  return {
    year: selectedYear(yearsWithData, chosenYear, currentYear),
    years: yearOptions(yearsWithData, currentYear),
    setYear: setChosenYear
  }
}
