// Small form to add a category with a name, a kind and an optional parent.
import { useState } from 'react'
import type { Category } from '@shared/types'

type NewCategoryFormProps = {
  categories: Category[]
  onAdd: (category: Category) => void
}

export function NewCategoryForm({ categories, onAdd }: NewCategoryFormProps): React.JSX.Element {
  const [name, setName] = useState('')
  const [kind, setKind] = useState<Category['kind']>('expense')
  const [parentId, setParentId] = useState('')

  const parentOptions = categories.filter(
    (category) => category.kind === kind && category.parentId === undefined
  )
  const validParent = parentOptions.some((category) => category.id === parentId)

  const add = (): void => {
    const category: Category = { id: crypto.randomUUID(), name: name.trim(), kind }
    onAdd(validParent ? { ...category, parentId } : category)
    setName('')
    setParentId('')
  }

  return (
    <div className="newCategory">
      <input
        type="text"
        placeholder="Nieuwe categorie"
        value={name}
        onChange={(event) => setName(event.target.value)}
      />
      <select value={kind} onChange={(event) => setKind(event.target.value as Category['kind'])}>
        <option value="expense">Uitgave</option>
        <option value="income">Inkomst</option>
      </select>
      <select
        value={validParent ? parentId : ''}
        onChange={(event) => setParentId(event.target.value)}
      >
        <option value="">Geen (hoofdcategorie)</option>
        {parentOptions.map((category) => (
          <option key={category.id} value={category.id}>
            {category.name}
          </option>
        ))}
      </select>
      <button disabled={name.trim() === ''} onClick={add}>
        Toevoegen
      </button>
    </div>
  )
}
