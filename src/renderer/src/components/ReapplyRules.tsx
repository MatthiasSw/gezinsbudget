// Button that applies the saved rules to existing transactions, with the result shown next to it.
import { describeError } from '../errorMessages'
import { useRuleReapply } from '../hooks/useRuleReapply'

type ReapplyRulesProps = {
  refreshKey: number
  disabled?: boolean
}

function applyLabel(pendingCount: number | null): string {
  if (!pendingCount) return 'Regels toepassen'
  return `Regels toepassen op ${pendingCount} ${pendingCount === 1 ? 'transactie' : 'transacties'}`
}

export function ReapplyRules({
  refreshKey,
  disabled = false
}: ReapplyRulesProps): React.JSX.Element {
  const { pendingCount, busy, message, error, apply } = useRuleReapply(refreshKey)
  const nothingToApply = pendingCount === null || pendingCount === 0

  return (
    <span className="inlineActions">
      <button
        className="secondary"
        disabled={disabled || busy || nothingToApply}
        title={nothingToApply ? 'Er valt niets toe te passen' : undefined}
        onClick={apply}
      >
        {applyLabel(pendingCount)}
      </button>
      {message && <span className="muted">{message}</span>}
      {error !== undefined && <span className="errorText">{describeError(error)}</span>}
    </span>
  )
}
