// Main screen shown once a data folder is configured: top bar, side navigation and the selected page.
// It also keeps the visited pages, for the back button in the top bar.
import { useCallback, useState } from 'react'
import type { LocalConfig } from '@shared/types'
import type { Filters } from '../filters'
import { useDataFolderStatus } from '../hooks/useDataFolderStatus'
import { useYearAccountSelection } from '../hooks/useYearAccountSelection'
import { canGoBack, goBack, openView, startHistory } from '../viewHistory'
import { ChartsView } from './ChartsView'
import { DataFolderBlockedScreen } from './DataFolderBlockedScreen'
import {
  ChartsIcon,
  InsightsIcon,
  OverviewIcon,
  RecurringIcon,
  SettingsIcon,
  TransactionsIcon
} from './icons'
import { InsightsView } from './InsightsView'
import { OverviewView } from './OverviewView'
import { RecurringView } from './RecurringView'
import { SettingsView } from './SettingsView'
import { SideNav, type NavItem } from './SideNav'
import { TopBar } from './TopBar'
import { TransactionsView } from './TransactionsView'

type MainScreenProps = {
  config: LocalConfig
  onChooseDataDir: () => void
}

type Page = 'transactions' | 'overview' | 'charts' | 'recurring' | 'insights' | 'settings'

const mainPages: NavItem<Page>[] = [
  { id: 'transactions', label: 'Transacties', icon: <TransactionsIcon /> },
  { id: 'overview', label: 'Overzicht', icon: <OverviewIcon /> },
  { id: 'charts', label: 'Grafieken', icon: <ChartsIcon /> },
  { id: 'recurring', label: 'Terugkerend', icon: <RecurringIcon /> },
  { id: 'insights', label: 'Interessant', icon: <InsightsIcon /> }
]

const footerPages: NavItem<Page>[] = [
  { id: 'settings', label: 'Instellingen', icon: <SettingsIcon /> }
]

function pageTitle(page: Page): string {
  return [...mainPages, ...footerPages].find((item) => item.id === page)?.label ?? ''
}

export function MainScreen({ config, onChooseDataDir }: MainScreenProps): React.JSX.Element {
  const [history, setHistory] = useState(() => startHistory<Page>('transactions'))
  const [dataRevision, setDataRevision] = useState(0)
  const selection = useYearAccountSelection()
  const markDataChanged = useCallback(() => setDataRevision((revision) => revision + 1), [])
  const folder = useDataFolderStatus(markDataChanged)

  const { page, filters: drillDown } = history.current
  const selectPage = (next: Page): void => setHistory(openView(history, next))
  const openTransactions = (filters: Filters): void =>
    setHistory(openView(history, 'transactions', filters))

  if (folder.status.kind === 'blocked') {
    return (
      <DataFolderBlockedScreen
        error={folder.status.error}
        dataDir={config.dataDir}
        onRetry={folder.checkNow}
        onChooseDataDir={onChooseDataDir}
      />
    )
  }

  return (
    <div className="appShell">
      <TopBar
        canGoBack={canGoBack(history)}
        onBack={() => setHistory(goBack(history))}
        onImported={markDataChanged}
      />
      <SideNav items={mainPages} footerItems={footerPages} current={page} onSelect={selectPage} />
      <main>
        <h1 className="pageTitle">{pageTitle(page)}</h1>
        {page === 'transactions' && (
          <TransactionsView
            key={history.current.id}
            dataRevision={dataRevision}
            initialFilters={drillDown}
            onImported={markDataChanged}
          />
        )}
        {page === 'overview' && (
          <OverviewView
            dataRevision={dataRevision}
            selection={selection}
            onOpenTransactions={openTransactions}
          />
        )}
        {page === 'charts' && (
          <ChartsView
            dataRevision={dataRevision}
            selection={selection}
            onOpenTransactions={openTransactions}
          />
        )}
        {page === 'recurring' && (
          <RecurringView dataRevision={dataRevision} onOpenTransactions={openTransactions} />
        )}
        {page === 'insights' && (
          <InsightsView
            dataRevision={dataRevision}
            selection={selection}
            onOpenTransactions={openTransactions}
          />
        )}
        {page === 'settings' && (
          <SettingsView
            config={config}
            dataRevision={dataRevision}
            onChooseDataDir={onChooseDataDir}
          />
        )}
      </main>
    </div>
  )
}
