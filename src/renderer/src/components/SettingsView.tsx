// Settings page: a section list on the left and the chosen section (folder, accounts, categories, budgets, rules) beside it.
import { useCallback, useState } from 'react'
import type { AddDefaultsResult } from '@shared/ruleTypes'
import type { LocalConfig } from '@shared/types'
import { useTransientMessage } from '../hooks/useTransientMessage'
import { pluralize } from '../plural'
import { AccountsView } from './AccountsView'
import { InfoTip } from './InfoTip'
import { BudgetsView } from './BudgetsView'
import { CategoriesView } from './CategoriesView'
import { RulesView } from './RulesView'
import { TabBar, type TabItem } from './TabBar'

type SettingsViewProps = {
  config: LocalConfig
  dataRevision: number
  onChooseDataDir: () => void
}

const defaultsMessageDurationMs = 15000

type SectionId = 'folder' | 'accounts' | 'categories' | 'budgets' | 'rules'

const sections: TabItem<SectionId>[] = [
  { id: 'folder', label: 'Gegevensmap', description: 'Waar je gegevens staan' },
  { id: 'accounts', label: 'Eigen rekeningen', description: 'Je eigen IBAN-nummers' },
  { id: 'categories', label: 'Categorieën', description: 'Hoe je uitgaven zijn ingedeeld' },
  { id: 'budgets', label: 'Budgetten', description: 'Een maximum per categorie' },
  { id: 'rules', label: 'Regels', description: 'Automatisch categoriseren' }
]

const dataFolderInfo =
  'Hier staan je transacties, categorieën en regels als gewone bestanden. Kies een gedeelde map, bijvoorbeeld op je netwerkschijf, als je met je partner dezelfde gegevens wil gebruiken. Het programma kan dan telkens maar op één pc tegelijk open staan.'

function describeDefaults(result: AddDefaultsResult): string {
  const parts = [
    result.addedRuleCount > 0 &&
      `${pluralize(result.addedRuleCount, 'regel', 'regels')} toegevoegd`,
    result.updatedRuleCount > 0 &&
      `${pluralize(result.updatedRuleCount, 'regel', 'regels')} bijgewerkt`,
    result.addedCategoryCount > 0 &&
      `${pluralize(result.addedCategoryCount, 'categorie', 'categorieën')} toegevoegd`
  ].filter(Boolean)
  if (parts.length === 0) return 'Alle standaardregels zijn al up-to-date. Er is niets gewijzigd.'

  const categories =
    result.addedCategoryNames.length > 0
      ? ` Nieuwe categorieën: ${result.addedCategoryNames.join(', ')}.`
      : ''
  return `${parts.join(', ')}.${categories} Klik op Regels toepassen om ze op je transacties los te laten.`
}

export function SettingsView({
  config,
  dataRevision,
  onChooseDataDir
}: SettingsViewProps): React.JSX.Element {
  const [current, setCurrent] = useState<SectionId>('folder')
  const [categoriesRevision, setCategoriesRevision] = useState(0)
  const [reloadKey, setReloadKey] = useState(0)
  const [defaultsMessage, showDefaultsMessage] = useTransientMessage(defaultsMessageDurationMs)
  const markCategoriesSaved = useCallback(
    () => setCategoriesRevision((revision) => revision + 1),
    []
  )

  const handleDefaultsAdded = (result: AddDefaultsResult): void => {
    showDefaultsMessage(describeDefaults(result))
    setReloadKey((key) => key + 1)
  }

  const pane = (id: SectionId, content: React.ReactNode): React.JSX.Element => (
    <div className="settingsPane" hidden={current !== id}>
      {content}
    </div>
  )

  return (
    <div className="settingsLayout">
      <TabBar items={sections} current={current} label="Instellingen" onSelect={setCurrent} />
      <div className="settingsContent">
        {pane(
          'folder',
          <section>
            <h2>
              Gegevensmap <InfoTip text={dataFolderInfo} />
            </h2>
            <div className="folderRow">
              <code className="folderPath">{config.dataDir}</code>
              <button className="secondary" onClick={onChooseDataDir}>
                Map wijzigen
              </button>
            </div>
          </section>
        )}
        {pane('accounts', <AccountsView dataRevision={dataRevision} />)}
        {pane(
          'categories',
          <CategoriesView key={`categories-${reloadKey}`} onSaved={markCategoriesSaved} />
        )}
        {pane('budgets', <BudgetsView categoriesRevision={categoriesRevision} />)}
        {pane(
          'rules',
          <RulesView
            key={`rules-${reloadKey}`}
            categoriesRevision={categoriesRevision}
            defaultsMessage={defaultsMessage}
            onDefaultsAdded={handleDefaultsAdded}
          />
        )}
      </div>
    </div>
  )
}
