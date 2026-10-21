// Shows how many transactions a rule touches, with a few examples.
import { formatCents } from '@shared/money'
import { formatBelgianDate } from '@shared/dates'
import type { RuleTestResult } from '@shared/ruleTypes'
import { describeError } from '../errorMessages'
import { transactionCount } from '../plural'

export type RuleTestOutcome =
  { ruleId: string; result: RuleTestResult } | { ruleId: string; error: unknown }

type RuleTestResultRowProps = {
  outcome: RuleTestOutcome
  columnCount: number
}

export function RuleTestResultRow({
  outcome,
  columnCount
}: RuleTestResultRowProps): React.JSX.Element {
  return (
    <tr className="testResult">
      <td colSpan={columnCount}>
        {'error' in outcome ? (
          <span className="errorText">{describeError(outcome.error)}</span>
        ) : (
          <TestSummary result={outcome.result} />
        )}
      </td>
    </tr>
  )
}

function TestSummary({ result }: { result: RuleTestResult }): React.JSX.Element {
  if (result.matchCount === 0) {
    return <span className="muted">Deze regel raakt geen transacties.</span>
  }
  return (
    <div>
      <strong>Deze regel raakt {transactionCount(result.matchCount)}.</strong>
      {result.unchangedCount > 0 && (
        <span className="muted">
          {' '}
          Bij {result.unchangedCount} daarvan verandert er niets: ze hebben al deze categorie of
          zijn handmatig ingedeeld.
        </span>
      )}
      <ul>
        {result.examples.map((example) => (
          <li key={example.id}>
            {formatBelgianDate(example.bookingDate)} · {example.counterpartyName ?? 'Onbekend'} ·{' '}
            {formatCents(example.amountCents)}
          </li>
        ))}
      </ul>
    </div>
  )
}
