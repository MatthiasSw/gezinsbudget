// Row of tabs; picks which section is shown or jumped to, optionally staying at the top while scrolling.
export type TabItem<TabId extends string> = {
  id: TabId
  label: string
  description?: string
}

type TabBarProps<TabId extends string> = {
  items: TabItem<TabId>[]
  current: TabId
  label: string
  sticky?: boolean
  onSelect: (id: TabId) => void
}

export function TabBar<TabId extends string>({
  items,
  current,
  label,
  sticky = false,
  onSelect
}: TabBarProps<TabId>): React.JSX.Element {
  return (
    <nav className={sticky ? 'tabBar sticky' : 'tabBar'} aria-label={label}>
      {items.map(({ id, label: itemLabel, description }) => (
        <button
          key={id}
          className={id === current ? 'tabItem active' : 'tabItem'}
          aria-current={id === current ? 'true' : undefined}
          title={description}
          onClick={() => onSelect(id)}
        >
          {itemLabel}
        </button>
      ))}
    </nav>
  )
}
