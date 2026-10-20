// Budget editor: an optional amount per expense category, per month or per year, saved with a button.
import { useCallback, useMemo } from 'react'
import { categoryLabel } from '@shared/categoryIcons'
import { flattenTree } from '@shared/categoryTree'
import type { Budget, BudgetPeriod, Category } from '@shared/types'
import { api } from '../api'
import {
  budgetDraftProblem,
  defaultBudgetPeriod,
  fromBudgetDraft,
  toBudgetDraft,
  type BudgetDraft
} from '../budgetDraft'
import { describeError } from '../errorMessages'
import { useAsyncData } from '../hooks/useAsyncData'
import { useDraftSave } from '../hooks/useDraftSave'
import { InfoTip } from './InfoTip'
import { SaveBar } from './SaveBar'

type BudgetsViewProps = {
  categoriesRevision: number
}

type BudgetsEditorProps = {
  budgets: Budget[]
  categories: Category[]
}

const budgetInfo =
  'Stel per uitgavencategorie in hoeveel je maximaal wil uitgeven, per maand of per jaar. Laat het bedrag leeg als je geen budget wil. Een budget op een hoofdcategorie telt ook de uitgaven van de subcategorieën mee. In het Overzicht zie je met een balk hoeveel van het jaarbudget al gebruikt is.'

const loadBudgetsAndCategories = (): Promise<[Budget[], Category[]]> =>
  Promise.all([api.budgets.get(), api.categories.get()])

async function saveBudgetDraft(draft: BudgetDraft): Promise<BudgetDraft> {
  return toBudgetDraft(await api.budgets.save(fromBudgetDraft(draft)))
}

export function BudgetsView({ categoriesRevision }: BudgetsViewProps): React.JSX.Element {
  const { state } = useAsyncData(loadBudgetsAndCategories, categoriesRevision)

  return (
    <section>
      <h2>
        Budgetten <InfoTip text={budgetInfo} />
      </h2>
      {state.status === 'loading' && <p className="muted">Laden…</p>}
      {state.status === 'error' && <p className="errorText">{describeError(state.error)}</p>}
      {state.status === 'ready' && (
        <BudgetsEditor budgets={state.data[0]} categories={state.data[1]} />
      )}
    </section>
  )
}

function BudgetsEditor({ budgets, categories }: BudgetsEditorProps): React.JSX.Element {
  const stored = useMemo(() => toBudgetDraft(budgets), [budgets])
  const validate = useCallback(
    (draft: BudgetDraft): string | null => budgetDraftProblem(draft, categories),
    [categories]
  )
  const { value, change, saveDraft, discard, status, hasUnsavedChanges } = useDraftSave({
    stored,
    save: saveBudgetDraft,
    validate
  })

  const rows = flattenTree(categories.filter((category) => category.kind === 'expense'))
  const update = (categoryId: string, changes: Partial<BudgetDraft[string]>): void =>
    change({
      ...value,
      [categoryId]: {
        amount: value[categoryId]?.amount ?? '',
        period: value[categoryId]?.period ?? defaultBudgetPeriod,
        ...changes
      }
    })

  return (
    <>
      <table className="budgets">
        <thead>
          <tr>
            <th>Categorie</th>
            <th>Budget</th>
            <th>Per</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(({ category, depth }) => (
            <tr key={category.id}>
              <td style={{ paddingLeft: `${8 + depth * 24}px` }}>{categoryLabel(category)}</td>
              <td>
                <span className="amountField">
                  <input
                    type="text"
                    inputMode="decimal"
                    aria-label={`Budget voor ${category.name}`}
                    placeholder="Geen budget"
                    value={value[category.id]?.amount ?? ''}
                    onChange={(event) => update(category.id, { amount: event.target.value })}
                  />
                  <span className="muted">€</span>
                </span>
              </td>
              <td>
                <select
                  aria-label={`Periode voor ${category.name}`}
                  value={value[category.id]?.period ?? defaultBudgetPeriod}
                  onChange={(event) =>
                    update(category.id, { period: event.target.value as BudgetPeriod })
                  }
                >
                  <option value="month">maand</option>
                  <option value="year">jaar</option>
                </select>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <SaveBar
        status={status}
        hasUnsavedChanges={hasUnsavedChanges}
        onSave={saveDraft}
        onDiscard={discard}
      />
    </>
  )
}
