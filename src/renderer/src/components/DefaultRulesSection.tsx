// The default rules that come with the app: switch them on or off, test them or copy one to your own rules.
import { Fragment, useState } from 'react'
import { categoryLabel } from '@shared/categoryIcons'
import type { Category, Rule } from '@shared/types'
import { ConfirmDialog } from './ConfirmDialog'
import { ExpandableText } from './ExpandableText'
import { InfoTip } from './InfoTip'
import { RuleTestResultRow, type RuleTestOutcome } from './RuleTestResultRow'

const columnCount = 4

const defaultsInfo =
  'Gezinsbudget levert regels mee voor bekende winkels en leveranciers, zoals apotheek, parking of Lidl. Ze staan hier apart, zodat je eigen regels overzichtelijk blijven. Je eigen regels gaan altijd voor op de standaardregels. Een standaardregel kan je niet aanpassen, wel uitzetten of kopiëren naar je eigen regels.'

type DefaultRulesSectionProps = {
  rules: Rule[]
  categories: Category[]
  testOutcome: RuleTestOutcome | undefined
  updateDisabled: boolean
  updateError: React.ReactNode
  updateMessage: string | null
  onToggle: (rule: Rule, enabled: boolean) => void
  onTest: (rule: Rule) => void
  onCopy: (rule: Rule) => void
  onUpdate: () => void
}

export function DefaultRulesSection({
  rules,
  categories,
  testOutcome,
  updateDisabled,
  updateError,
  updateMessage,
  onToggle,
  onTest,
  onCopy,
  onUpdate
}: DefaultRulesSectionProps): React.JSX.Element {
  const [confirming, setConfirming] = useState(false)
  const categoryById = new Map(categories.map((category) => [category.id, category]))

  return (
    <>
      {updateMessage && <p className="notice">{updateMessage}</p>}
      <details className="defaultRules">
        <summary>
          Standaardregels ({rules.length}) <InfoTip text={defaultsInfo} />
        </summary>

        <p className="muted">
          Bijwerken haalt de nieuwste standaardregels binnen. Je eigen regels en je aan/uit-keuzes
          blijven bewaard.
        </p>
        <div className="defaultRulesActions">
          <button
            className="secondary"
            onClick={() => setConfirming(true)}
            disabled={updateDisabled}
          >
            Standaardregels bijwerken
          </button>
          {updateError}
        </div>

        {rules.length === 0 ? (
          <p className="muted">
            Er zijn geen standaardregels. Klik op Bijwerken om ze toe te voegen.
          </p>
        ) : (
          <div className="scrollX">
            <table className="rules defaultTable">
              <thead>
                <tr>
                  <th>Actief</th>
                  <th>Categorie</th>
                  <th>Zoektermen</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {rules.map((rule) => {
                  const category = categoryById.get(rule.categoryId)
                  return (
                    <Fragment key={rule.id}>
                      <tr className={rule.enabled ? '' : 'inactive'}>
                        <td>
                          <input
                            type="checkbox"
                            aria-label="Actief"
                            checked={rule.enabled}
                            onChange={(event) => onToggle(rule, event.target.checked)}
                          />
                        </td>
                        <td className="nowrap">{category ? categoryLabel(category) : '–'}</td>
                        <td className="keywordCell">
                          <ExpandableText text={rule.value} />
                        </td>
                        <td className="nowrap">
                          <button className="secondary compact" onClick={() => onTest(rule)}>
                            Test
                          </button>{' '}
                          <button className="secondary compact" onClick={() => onCopy(rule)}>
                            Kopiëren naar mijn regels
                          </button>
                        </td>
                      </tr>
                      {testOutcome?.ruleId === rule.id && (
                        <RuleTestResultRow outcome={testOutcome} columnCount={columnCount} />
                      )}
                    </Fragment>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
        {confirming && (
          <ConfirmDialog
            title="Standaardregels bijwerken"
            confirmLabel="Bijwerken"
            tone="primary"
            message={
              <>
                <p>Dit gebeurt er:</p>
                <ul className="plainList">
                  <li>
                    Standaardregels en -categorieën die nog ontbreken, worden toegevoegd. Bestaande
                    categorieën met dezelfde naam worden hergebruikt.
                  </li>
                  <li>
                    De zoektermen van de standaardregels worden vervangen door de nieuwste versie.
                    Een kopie in Mijn regels blijft zoals ze is.
                  </li>
                  <li>
                    Je eigen regels en je aan/uit-keuzes bij de standaardregels blijven behouden.
                  </li>
                  <li>
                    Er verandert nog niets aan je transacties. Klik daarna op Regels toepassen om de
                    regels op bestaande transacties los te laten.
                  </li>
                </ul>
              </>
            }
            onConfirm={() => {
              setConfirming(false)
              onUpdate()
            }}
            onCancel={() => setConfirming(false)}
          />
        )}
      </details>
    </>
  )
}
