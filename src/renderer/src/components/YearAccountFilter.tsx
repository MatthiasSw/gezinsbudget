// Filter row to pick a year and an account; shared by the overview and the charts.
import type { Account } from '@shared/types'
import { InfoTip } from './InfoTip'

type YearAccountFilterProps = {
  year: number
  years: number[]
  accountId: string
  accounts: Account[]
  onYearChange: (year: number) => void
  onAccountChange: (accountId: string) => void
  info?: string
}

export function YearAccountFilter({
  year,
  years,
  accountId,
  accounts,
  onYearChange,
  onAccountChange,
  info
}: YearAccountFilterProps): React.JSX.Element {
  return (
    <div className="filterBar">
      <label>
        Jaar
        <select value={year} onChange={(event) => onYearChange(Number(event.target.value))}>
          {years.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </label>
      <label>
        Rekening
        <select value={accountId} onChange={(event) => onAccountChange(event.target.value)}>
          <option value="">Alle rekeningen</option>
          {accounts.map((account) => (
            <option key={account.iban} value={account.iban}>
              {account.name}
            </option>
          ))}
        </select>
      </label>
      {info && <InfoTip text={info} />}
    </div>
  )
}
