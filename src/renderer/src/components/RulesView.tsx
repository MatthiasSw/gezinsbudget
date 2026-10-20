// Rule manager: your own rules (edit, reorder, test, delete) and, apart from them, the default rules.
import { Fragment, useState } from 'react'
import { flattenTree } from '@shared/categoryTree'
import type { AddDefaultsResult } from '@shared/ruleTypes'
import type { Category, Rule } from '@shared/types'
import { api } from '../api'
import { describeError } from '../errorMessages'
import { useAsyncData } from '../hooks/useAsyncData'
import { useDraftSave } from '../hooks/useDraftSave'
import { moveItem } from '../listMove'
import { ConfirmDialog } from './ConfirmDialog'
import { DefaultRulesSection } from './DefaultRulesSection'
import { InfoTip } from './InfoTip'
import { ReapplyRules } from './ReapplyRules'
import { RuleEditorRow } from './RuleEditorRow'
import { RuleTestResultRow, type RuleTestOutcome } from './RuleTestResultRow'
import { SaveBar } from './SaveBar'

const columnCount = 8

const rulesInfo =
  'Een regel geeft nieuwe transacties automatisch een categorie. De eerste regel die past, wint: sleep je eigen regels om de volgorde te wijzigen. Je eigen regels gaan voor op de standaardregels. Handmatig gekozen categorieën blijven altijd staan.'
const capitalsInfo =
  'Uit (standaard): ‘Aldi’, ‘ALDI’ en ‘aldi’ passen allemaal. Aan: de schrijfwijze moet exact kloppen.'

type RulesViewProps = {
  categoriesRevision: number
  defaultsMessage: string | null
  onDefaultsAdded: (result: AddDefaultsResult) => void
}

type RulesEditorProps = {
  stored: Rule[]
  categories: Category[]
  defaultsMessage: string | null
  onDefaultsAdded: (result: AddDefaultsResult) => void
}

function incompleteRuleMessage(rules: Rule[]): string | null {
  if (rules.some((rule) => rule.value.trim() === '')) return 'vul bij elke regel een waarde in'
  if (rules.some((rule) => rule.categoryId === '')) return 'kies bij elke regel een categorie'
  return null
}

export function RulesView({
  categoriesRevision,
  defaultsMessage,
  onDefaultsAdded
}: RulesViewProps): React.JSX.Element {
  const rulesData = useAsyncData(api.rules.get)
  const categoriesData = useAsyncData(api.categories.get, categoriesRevision)

  if (rulesData.state.status === 'error') {
    return <p className="errorText">{describeError(rulesData.state.error)}</p>
  }
  if (rulesData.state.status === 'loading' || categoriesData.state.status !== 'ready') {
    return <p className="muted">Laden…</p>
  }
  return (
    <RulesEditor
      stored={rulesData.state.data}
      categories={categoriesData.state.data}
      defaultsMessage={defaultsMessage}
      onDefaultsAdded={onDefaultsAdded}
    />
  )
}

function RulesEditor({
  stored,
  categories,
  defaultsMessage,
  onDefaultsAdded
}: RulesEditorProps): React.JSX.Element {
  const [savedCount, setSavedCount] = useState(0)
  const {
    value: rules,
    change,
    saveDraft,
    discard,
    status,
    hasUnsavedChanges
  } = useDraftSave({
    stored,
    save: api.rules.save,
    validate: incompleteRuleMessage,
    onSaved: () => setSavedCount((count) => count + 1)
  })
  const [testOutcome, setTestOutcome] = useState<RuleTestOutcome | undefined>(undefined)
  const [ruleToDelete, setRuleToDelete] = useState<Rule | null>(null)
  const [defaultsError, setDefaultsError] = useState<unknown>(undefined)
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const [dropIndex, setDropIndex] = useState<number | null>(null)
  const firstCategoryId = flattenTree(categories)[0]?.category.id ?? ''
  const mine = rules.filter((rule) => !rule.isDefault)
  const defaults = rules.filter((rule) => rule.isDefault)

  const replace = (changed: Rule): void =>
    change(rules.map((rule) => (rule.id === changed.id ? changed : rule)))
  const remove = (id: string): void => change(rules.filter((rule) => rule.id !== id))
  const changeMine = (next: Rule[]): void => change([...next, ...defaults])
  const add = (): void =>
    changeMine([
      ...mine,
      {
        id: crypto.randomUUID(),
        field: 'counterpartyName',
        operator: 'contains',
        value: '',
        caseSensitive: false,
        categoryId: firstCategoryId,
        enabled: true
      }
    ])
  const copyToMine = (rule: Rule): void =>
    changeMine([...mine, { ...rule, id: crypto.randomUUID(), isDefault: false }])

  const endDrag = (): void => {
    setDragIndex(null)
    setDropIndex(null)
  }
  const dropOn = (index: number): void => {
    if (dragIndex !== null) changeMine(moveItem(mine, dragIndex, index))
    endDrag()
  }

  const addDefaults = async (): Promise<void> => {
    try {
      setDefaultsError(undefined)
      onDefaultsAdded(await api.rules.addDefaults())
    } catch (error) {
      setDefaultsError(error)
    }
  }

  const test = async (rule: Rule): Promise<void> => {
    try {
      setTestOutcome({ ruleId: rule.id, result: await api.rules.test(rule) })
    } catch (error) {
      setTestOutcome({ ruleId: rule.id, error })
    }
  }

  return (
    <section>
      <h2>
        Regels <InfoTip text={rulesInfo} />
      </h2>

      <h3>Mijn regels ({mine.length})</h3>
      {mine.length === 0 && (
        <p className="muted">
          Je hebt nog geen eigen regels. De standaardregels hieronder werken al voor je.
        </p>
      )}
      {mine.length > 0 && (
        <div className="scrollX">
          <table className="rules">
            <thead>
              <tr>
                <th>Volgorde</th>
                <th>Actief</th>
                <th>Veld</th>
                <th>Voorwaarde</th>
                <th>Waarde</th>
                <th className="narrowHeader">
                  Hoofdletter&shy;gevoelig <InfoTip text={capitalsInfo} />
                </th>
                <th>Categorie</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {mine.map((rule, index) => (
                <Fragment key={rule.id}>
                  <RuleEditorRow
                    rule={rule}
                    categories={categories}
                    canMoveUp={index > 0}
                    canMoveDown={index < mine.length - 1}
                    drag={{
                      isDropTarget:
                        dragIndex !== null && dropIndex === index && dragIndex !== index,
                      onDragStart: () => setDragIndex(index),
                      onDragOver: () => setDropIndex(index),
                      onDrop: () => dropOn(index),
                      onDragEnd: endDrag
                    }}
                    onChange={replace}
                    onMove={(direction) => changeMine(moveItem(mine, index, index + direction))}
                    onTest={() => test(rule)}
                    onDelete={() => setRuleToDelete(rule)}
                  />
                  {testOutcome?.ruleId === rule.id && (
                    <RuleTestResultRow outcome={testOutcome} columnCount={columnCount} />
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="rulesFooter">
        <button className="secondary" onClick={add}>
          Regel toevoegen
        </button>
        <ReapplyRules refreshKey={savedCount} disabled={hasUnsavedChanges} />
      </div>

      <DefaultRulesSection
        rules={defaults}
        categories={categories}
        testOutcome={testOutcome}
        updateDisabled={hasUnsavedChanges}
        updateMessage={defaultsMessage}
        updateError={
          defaultsError !== undefined && (
            <span className="errorText">{describeError(defaultsError)}</span>
          )
        }
        onToggle={(rule, enabled) => replace({ ...rule, enabled })}
        onTest={test}
        onCopy={copyToMine}
        onUpdate={addDefaults}
      />

      <SaveBar
        status={status}
        hasUnsavedChanges={hasUnsavedChanges}
        onSave={saveDraft}
        onDiscard={discard}
      />

      {ruleToDelete && (
        <ConfirmDialog
          title="Regel verwijderen"
          message={`De regel ‘${ruleToDelete.value}’ wordt verwijderd. Transacties die al een categorie kregen door deze regel, behouden die tot je de regels opnieuw toepast.`}
          confirmLabel="Verwijderen"
          onConfirm={() => {
            remove(ruleToDelete.id)
            setRuleToDelete(null)
          }}
          onCancel={() => setRuleToDelete(null)}
        />
      )}
    </section>
  )
}
