// One editable rule: order, switch, condition, category and the test and delete actions.
import type { Category, Rule, RuleField, RuleOperator } from '@shared/types'
import { CategorySelect } from './CategorySelect'
import { ruleFieldLabels, ruleOperatorLabels } from './ruleLabels'

export type RuleDragHandlers = {
  isDropTarget: boolean
  onDragStart: () => void
  onDragOver: () => void
  onDrop: () => void
  onDragEnd: () => void
}

type RuleEditorRowProps = {
  rule: Rule
  categories: Category[]
  canMoveUp: boolean
  canMoveDown: boolean
  drag: RuleDragHandlers
  onChange: (changed: Rule) => void
  onMove: (direction: -1 | 1) => void
  onTest: () => void
  onDelete: () => void
}

export function RuleEditorRow({
  rule,
  categories,
  canMoveUp,
  canMoveDown,
  drag,
  onChange,
  onMove,
  onTest,
  onDelete
}: RuleEditorRowProps): React.JSX.Element {
  const classes = [rule.enabled ? '' : 'inactive', drag.isDropTarget ? 'dropTarget' : '']
    .filter(Boolean)
    .join(' ')

  return (
    <tr
      className={classes}
      onDragOver={(event) => {
        event.preventDefault()
        drag.onDragOver()
      }}
      onDrop={(event) => {
        event.preventDefault()
        drag.onDrop()
      }}
    >
      <td className="nowrap">
        <span
          className="dragHandle"
          draggable
          title="Sleep om te verplaatsen"
          aria-label="Sleep om te verplaatsen"
          onDragStart={(event) => {
            const row = event.currentTarget.closest('tr')
            if (row) event.dataTransfer.setDragImage(row, 0, 0)
            event.dataTransfer.effectAllowed = 'move'
            drag.onDragStart()
          }}
          onDragEnd={drag.onDragEnd}
        >
          ⠿
        </span>
        <button
          className="secondary compact"
          aria-label="Omhoog"
          disabled={!canMoveUp}
          onClick={() => onMove(-1)}
        >
          ↑
        </button>{' '}
        <button
          className="secondary compact"
          aria-label="Omlaag"
          disabled={!canMoveDown}
          onClick={() => onMove(1)}
        >
          ↓
        </button>
      </td>
      <td>
        <input
          type="checkbox"
          aria-label="Actief"
          checked={rule.enabled}
          onChange={(event) => onChange({ ...rule, enabled: event.target.checked })}
        />
      </td>
      <td>
        <select
          value={rule.field}
          onChange={(event) => onChange({ ...rule, field: event.target.value as RuleField })}
        >
          {Object.entries(ruleFieldLabels).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </td>
      <td>
        <select
          value={rule.operator}
          onChange={(event) => onChange({ ...rule, operator: event.target.value as RuleOperator })}
        >
          {Object.entries(ruleOperatorLabels).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </td>
      <td>
        <input
          type="text"
          value={rule.value}
          title={rule.value}
          onChange={(event) => onChange({ ...rule, value: event.target.value })}
        />
      </td>
      <td>
        <input
          type="checkbox"
          aria-label="Hoofdlettergevoelig"
          checked={rule.caseSensitive}
          onChange={(event) => onChange({ ...rule, caseSensitive: event.target.checked })}
        />
      </td>
      <td>
        <CategorySelect
          categories={categories}
          value={rule.categoryId}
          emptyLabel="Kies een categorie"
          onChange={(categoryId) => onChange({ ...rule, categoryId: categoryId ?? '' })}
        />
      </td>
      <td className="nowrap">
        <button className="secondary compact" onClick={onTest}>
          Test
        </button>{' '}
        <button className="secondary compact" onClick={onDelete}>
          Verwijderen
        </button>
      </td>
    </tr>
  )
}
