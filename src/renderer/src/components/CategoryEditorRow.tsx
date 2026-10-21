// One editable row in the category manager: icon, name, parent, whether it counts in the totals, and delete.
import { categoryIcon } from '@shared/categoryIcons'
import { descendantIds, type TreeGuide } from '@shared/categoryTree'
import type { Category } from '@shared/types'
import { IconPicker } from './IconPicker'

type CategoryEditorRowProps = {
  category: Category
  depth: number
  guides: TreeGuide[]
  categories: Category[]
  onChange: (changed: Category) => void
  onDelete: (category: Category) => void
}

// The flag is stored only when set, so categories that count normally stay unchanged on disk.
function withExclusion(category: Category, excluded: boolean): Category {
  const { excludedFromTotals: previous, ...rest } = category
  void previous
  return excluded ? { ...rest, excludedFromTotals: true } : rest
}

export function CategoryEditorRow({
  category,
  depth,
  guides,
  categories,
  onChange,
  onDelete
}: CategoryEditorRowProps): React.JSX.Element {
  const blockedParents = new Set(descendantIds(categories, category.id))
  const hasChildren = categories.some((candidate) => candidate.parentId === category.id)
  const parentOptions = hasChildren
    ? []
    : categories.filter(
        (candidate) =>
          candidate.kind === category.kind &&
          !blockedParents.has(candidate.id) &&
          (candidate.parentId === undefined || candidate.id === category.parentId)
      )

  return (
    <tr>
      <td>
        <IconPicker
          icon={categoryIcon(category)}
          onChange={(icon) => onChange({ ...category, icon })}
        />
      </td>
      <td className="treeCell" style={{ paddingLeft: `${8 + depth * 24}px` }}>
        {guides.map((guide, level) =>
          guide === 'blank' ? null : (
            <span key={level} className={`guide ${guide}`} style={{ left: 20 + level * 24 }} />
          )
        )}
        <input
          type="text"
          value={category.name}
          onChange={(event) => onChange({ ...category, name: event.target.value })}
        />
      </td>
      <td>{category.kind === 'income' ? 'Inkomst' : 'Uitgave'}</td>
      <td>
        <select
          value={category.parentId ?? ''}
          onChange={(event) => {
            const { parentId: removedParent, ...rest } = category
            void removedParent
            onChange(event.target.value === '' ? rest : { ...rest, parentId: event.target.value })
          }}
        >
          <option value="">Geen (hoofdcategorie)</option>
          {parentOptions.map((option) => (
            <option key={option.id} value={option.id}>
              {option.name}
            </option>
          ))}
        </select>
      </td>
      <td>
        <input
          type="checkbox"
          aria-label={`${category.name} telt mee in totalen`}
          checked={!category.excludedFromTotals}
          onChange={(event) => onChange(withExclusion(category, !event.target.checked))}
        />
      </td>
      <td>
        <button
          className="secondary compact"
          disabled={hasChildren}
          title={hasChildren ? 'Verwijder of verplaats eerst de subcategorieën' : undefined}
          onClick={() => onDelete(category)}
        >
          Verwijderen
        </button>
      </td>
    </tr>
  )
}
