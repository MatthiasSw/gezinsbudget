// Category manager: add, rename, choose an icon and parent, leave a category out of the totals, and delete; changes are saved with a button.
import { useState } from 'react'
import { findTooDeepCategory, flattenTree, treeGuides } from '@shared/categoryTree'
import type { Category } from '@shared/types'
import { api } from '../api'
import { describeError } from '../errorMessages'
import { useAsyncData } from '../hooks/useAsyncData'
import { useDraftSave } from '../hooks/useDraftSave'
import { SaveBar } from './SaveBar'
import { CategoryEditorRow } from './CategoryEditorRow'
import { ConfirmDialog } from './ConfirmDialog'
import { InfoTip } from './InfoTip'
import { NewCategoryForm } from './NewCategoryForm'

type CategoriesViewProps = {
  onSaved: () => void
}

type CategoriesEditorProps = {
  stored: Category[]
  onSaved: () => void
}

const countsInfo =
  'Transacties in een categorie waarvan Meetellen uitstaat, tellen niet mee als inkomst of uitgave in het overzicht, de grafieken, de inzichten en de terugkerende uitgaven. Je ziet ze wel nog in de transacties. Subcategorieën volgen de hoofdcategorie.'

function categoryProblem(categories: Category[]): string | null {
  if (categories.some((category) => category.name.trim() === '')) {
    return 'geef elke categorie een naam'
  }
  const tooDeep = findTooDeepCategory(categories)
  if (tooDeep) {
    return `‘${tooDeep.name}’ staat te diep: een subcategorie kan geen eigen subcategorieën hebben. Kies bij Hoort bij een hoofdcategorie`
  }
  return null
}

export function CategoriesView({ onSaved }: CategoriesViewProps): React.JSX.Element {
  const { state } = useAsyncData(api.categories.get)

  if (state.status === 'loading') return <p className="muted">Laden…</p>
  if (state.status === 'error') return <p className="errorText">{describeError(state.error)}</p>
  return <CategoriesEditor stored={state.data} onSaved={onSaved} />
}

function CategoriesEditor({ stored, onSaved }: CategoriesEditorProps): React.JSX.Element {
  const {
    value: categories,
    change,
    saveDraft,
    discard,
    status,
    hasUnsavedChanges
  } = useDraftSave({
    stored,
    save: api.categories.save,
    validate: categoryProblem,
    onSaved
  })

  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null)

  const rows = flattenTree(categories)
  const guides = treeGuides(rows)

  const replace = (changed: Category): void =>
    change(categories.map((category) => (category.id === changed.id ? changed : category)))

  return (
    <section>
      <h2>Categorieën</h2>
      <NewCategoryForm categories={categories} onAdd={(added) => change([...categories, added])} />

      <table className="categories">
        <thead>
          <tr>
            <th>Icoon</th>
            <th>Naam</th>
            <th>Soort</th>
            <th>Hoort bij</th>
            <th>
              Meetellen <InfoTip text={countsInfo} />
            </th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {rows.map(({ category, depth }, index) => (
            <CategoryEditorRow
              key={category.id}
              category={category}
              depth={depth}
              guides={guides[index]}
              categories={categories}
              onChange={replace}
              onDelete={setCategoryToDelete}
            />
          ))}
        </tbody>
      </table>

      <SaveBar
        status={status}
        hasUnsavedChanges={hasUnsavedChanges}
        onSave={saveDraft}
        onDiscard={discard}
      />
      {categoryToDelete && (
        <ConfirmDialog
          title="Categorie verwijderen"
          message={`De categorie ‘${categoryToDelete.name}’ wordt verwijderd. Transacties met deze categorie krijgen geen categorie meer en regels die ernaar verwijzen worden ook verwijderd. Dit kan niet ongedaan gemaakt worden.`}
          confirmLabel="Verwijderen"
          onConfirm={() => {
            change(categories.filter((candidate) => candidate.id !== categoryToDelete.id))
            setCategoryToDelete(null)
          }}
          onCancel={() => setCategoryToDelete(null)}
        />
      )}
    </section>
  )
}
