// Dropdown to choose a category; subcategories follow their main category, indented.
import { indentedCategoryLabel } from '@shared/categoryIcons'
import { flattenTree } from '@shared/categoryTree'
import type { Category } from '@shared/types'

type CategorySelectProps = {
  categories: Category[]
  value: string | undefined
  emptyLabel: string
  onChange: (categoryId: string | null) => void
}

export function CategorySelect({
  categories,
  value,
  emptyLabel,
  onChange
}: CategorySelectProps): React.JSX.Element {
  const rows = flattenTree(categories)

  return (
    <select
      value={value ?? ''}
      onChange={(event) => onChange(event.target.value === '' ? null : event.target.value)}
    >
      <option value="">{emptyLabel}</option>
      {rows.map(({ category, depth }) => (
        <option key={category.id} value={category.id}>
          {indentedCategoryLabel(category, depth)}
        </option>
      ))}
    </select>
  )
}
