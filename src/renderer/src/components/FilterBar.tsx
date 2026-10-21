// Filter controls above the transaction list: period, account, category, internal transfers, search.
import { indentedCategoryLabel } from '@shared/categoryIcons'
import { flattenTree } from '@shared/categoryTree'
import { presetRange, todayAsIso, type PeriodPreset } from '@shared/periods'
import { uncategorizedFilter, type InternalTransferFilter } from '@shared/transactionQuery'
import type { Account, Category } from '@shared/types'
import type { Filters } from '../filters'
import { InfoTip } from './InfoTip'

type FilterBarProps = {
  filters: Filters
  accounts: Account[]
  categories: Category[]
  onChange: (changes: Partial<Filters>) => void
}

const internalInfo =
  'Een interne overboeking is geld dat van een van je eigen rekeningen naar een andere eigen rekening gaat. Voorbeeld: je zet 500 € van je zichtrekening op je spaarrekening. Op de zichtrekening staat dan -500 € en op de spaarrekening +500 €. Je gaf niets uit en verdiende niets, het geld is alleen verplaatst. Zo een overboeking telt daarom niet mee als inkomst of uitgave in het overzicht en de grafieken. Verbergen: toont ze niet. Tonen: toont alles. Enkel interne: toont alleen die overboekingen. Het programma herkent ze aan je eigen rekeningen in Instellingen, Eigen rekeningen.'

const presets: { preset: PeriodPreset; label: string }[] = [
  { preset: 'thisMonth', label: 'Deze maand' },
  { preset: 'lastMonth', label: 'Vorige maand' },
  { preset: 'thisYear', label: 'Dit jaar' },
  { preset: 'lastYear', label: 'Vorig jaar' },
  { preset: 'all', label: 'Alles' }
]

export function FilterBar({
  filters,
  accounts,
  categories,
  onChange
}: FilterBarProps): React.JSX.Element {
  const today = todayAsIso()

  return (
    <div className="filterBar">
      <div className="presets">
        {presets.map(({ preset, label }) => {
          const range = presetRange(preset, today)
          const active = (range.from ?? '') === filters.from && (range.to ?? '') === filters.to
          return (
            <button
              key={preset}
              className={active ? 'chip active' : 'chip'}
              onClick={() => onChange({ from: range.from ?? '', to: range.to ?? '' })}
            >
              {label}
            </button>
          )
        })}
      </div>

      <label>
        Van
        <input
          type="date"
          value={filters.from}
          onChange={(event) => onChange({ from: event.target.value })}
        />
      </label>
      <label>
        Tot en met
        <input
          type="date"
          value={filters.to}
          onChange={(event) => onChange({ to: event.target.value })}
        />
      </label>

      <label>
        Rekening
        <select
          value={filters.accountId}
          onChange={(event) => onChange({ accountId: event.target.value })}
        >
          <option value="">Alle rekeningen</option>
          {accounts.map((account) => (
            <option key={account.iban} value={account.iban}>
              {account.name}
            </option>
          ))}
        </select>
      </label>

      <label>
        Categorie
        <select
          value={filters.categoryId}
          onChange={(event) => onChange({ categoryId: event.target.value })}
        >
          <option value="">Alle categorieën</option>
          <option value={uncategorizedFilter}>Zonder categorie</option>
          {flattenTree(categories).map(({ category, depth }) => (
            <option key={category.id} value={category.id}>
              {indentedCategoryLabel(category, depth)}
            </option>
          ))}
        </select>
      </label>

      <label>
        <span>
          Interne overboekingen <InfoTip text={internalInfo} />
        </span>
        <select
          value={filters.internal}
          onChange={(event) => onChange({ internal: event.target.value as InternalTransferFilter })}
        >
          <option value="hide">Verbergen</option>
          <option value="show">Tonen</option>
          <option value="only">Enkel interne</option>
        </select>
      </label>

      <label className="grow">
        Zoeken
        <input
          type="search"
          placeholder="Naam, mededeling, IBAN of bedrag"
          value={filters.search}
          onChange={(event) => onChange({ search: event.target.value })}
        />
      </label>
    </div>
  )
}
