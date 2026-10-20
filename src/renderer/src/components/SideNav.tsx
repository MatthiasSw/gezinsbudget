// Vertical navigation with the main pages on top and the settings at the bottom.
export type NavItem<PageId extends string> = {
  id: PageId
  label: string
  icon: React.ReactNode
}

type SideNavProps<PageId extends string> = {
  items: NavItem<PageId>[]
  footerItems: NavItem<PageId>[]
  current: PageId
  onSelect: (id: PageId) => void
}

export function SideNav<PageId extends string>({
  items,
  footerItems,
  current,
  onSelect
}: SideNavProps<PageId>): React.JSX.Element {
  const renderItem = ({ id, label, icon }: NavItem<PageId>): React.JSX.Element => (
    <button
      key={id}
      className={id === current ? 'navItem active' : 'navItem'}
      onClick={() => onSelect(id)}
    >
      {icon}
      <span>{label}</span>
    </button>
  )

  return (
    <nav className="sideNav">
      <div className="navGroup">{items.map(renderItem)}</div>
      <div className="navGroup">{footerItems.map(renderItem)}</div>
    </nav>
  )
}
