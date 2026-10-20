// Decides which years the year filters offer and which one is selected.
export function yearOptions(yearsWithData: number[], currentYear: number): number[] {
  return yearsWithData.length === 0 ? [currentYear] : yearsWithData
}

export function selectedYear(
  yearsWithData: number[],
  chosen: number | null,
  currentYear: number
): number {
  const options = yearOptions(yearsWithData, currentYear)
  if (chosen !== null && options.includes(chosen)) return chosen
  return options.includes(currentYear) ? currentYear : options[0]
}
