// Tests the page history behind the back button.
import { describe, expect, it } from 'vitest'
import { drillDownFilters } from './filters'
import { canGoBack, goBack, openView, startHistory } from './viewHistory'

type Page = 'transactions' | 'overview' | 'charts'

describe('viewHistory', () => {
  it('starts on one page with nothing to go back to', () => {
    const history = startHistory<Page>('transactions')
    expect(history.current.page).toBe('transactions')
    expect(canGoBack(history)).toBe(false)
    expect(goBack(history)).toBe(history)
  })

  it('goes back to the previous page, also after a plain page switch', () => {
    let history = startHistory<Page>('transactions')
    history = openView(history, 'overview')
    history = openView(history, 'charts')
    expect(canGoBack(history)).toBe(true)

    history = goBack(history)
    expect(history.current.page).toBe('overview')
    history = goBack(history)
    expect(history.current.page).toBe('transactions')
    expect(canGoBack(history)).toBe(false)
  })

  it('does not add the page that is already shown', () => {
    const history = startHistory<Page>('overview')
    expect(openView(history, 'overview')).toBe(history)
  })

  it('returns to the page a click-through came from and gives each visit its own id', () => {
    const filters = drillDownFilters({ categoryId: 'wonen' })
    const overview = openView(startHistory<Page>('transactions'), 'overview')
    const clicked = openView(overview, 'transactions', filters)
    expect(clicked.current.filters).toBe(filters)
    expect(clicked.current.id).not.toBe(overview.current.id)

    const back = goBack(clicked)
    expect(back.current).toBe(overview.current)
    expect(openView(back, 'transactions', filters).current.id).not.toBe(clicked.current.id)
  })

  it('opens the transactions again when the shown ones came from a click-through', () => {
    const filters = drillDownFilters({ categoryId: 'wonen' })
    const clicked = openView(startHistory<Page>('overview'), 'transactions', filters)
    const plain = openView(clicked, 'transactions')
    expect(plain.current.filters).toBeUndefined()
    expect(canGoBack(plain)).toBe(true)
  })
})
