// Progress bar showing how much of a yearly budget is spent, with the amounts as text.
import type { BudgetProgress, BudgetStatus } from '@shared/budgets'
import { formatCents } from '@shared/money'

type BudgetBarProps = {
  progress: BudgetProgress
}

const statusText: Record<BudgetStatus, string> = {
  ok: '',
  warning: 'Bijna op',
  over: 'Boven budget'
}

export function BudgetBar({ progress }: BudgetBarProps): React.JSX.Element {
  const percent = Math.round(progress.ratio * 100)
  const summary = `${formatCents(progress.spentCents)} van ${formatCents(progress.budgetCents)}`

  return (
    <div className="budgetBar">
      <div className="budgetTrack">
        <div
          className={`budgetFill ${progress.status}`}
          style={{ width: `${Math.min(100, percent)}%` }}
        />
      </div>
      <span className="budgetText">
        {summary} ({percent}%)
      </span>
      {progress.status !== 'ok' && (
        <span className={`budgetStatus ${progress.status}`}>{statusText[progress.status]}</span>
      )}
    </div>
  )
}
