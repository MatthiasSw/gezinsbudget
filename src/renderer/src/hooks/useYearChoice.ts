// Loads the years that have transactions and keeps the year chosen by the user.
import { useState } from 'react'
import { api } from '../api'
import { selectedYear, yearOptions } from '../yearChoice'
import { useAsyncData } from './useAsyncData'

export function useYearChoice(dataRevision: number): {
  year: number
  years: number[]
  setYear: (year: number) => void
} {
  const { state } = useAsyncData(api.overview.years, dataRevision)
  const [chosen, setChosen] = useState<number | null>(null)
  const currentYear = new Date().getFullYear()
  const yearsWithData = state.status === 'ready' ? state.data : []

  return {
    year: selectedYear(yearsWithData, chosen, currentYear),
    years: yearOptions(yearsWithData, currentYear),
    setYear: setChosen
  }
}
