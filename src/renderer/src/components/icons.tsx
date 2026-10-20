// Small stroke icons used by the navigation and buttons.
type IconProps = {
  paths: string[]
}

function Icon({ paths }: IconProps): React.JSX.Element {
  return (
    <svg
      className="icon"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths.map((path) => (
        <path key={path} d={path} />
      ))}
    </svg>
  )
}

export function TransactionsIcon(): React.JSX.Element {
  return <Icon paths={['M8 6h13', 'M8 12h13', 'M8 18h13', 'M3 6h.01', 'M3 12h.01', 'M3 18h.01']} />
}

export function RecurringIcon(): React.JSX.Element {
  return (
    <Icon
      paths={[
        'M17 2l4 4-4 4',
        'M3 11V9a4 4 0 0 1 4-4h14',
        'M7 22l-4-4 4-4',
        'M21 13v2a4 4 0 0 1-4 4H3'
      ]}
    />
  )
}

export function InsightsIcon(): React.JSX.Element {
  return (
    <Icon
      paths={[
        'M9 18h6',
        'M10 22h4',
        'M12 2a7 7 0 0 0-4 12.7c.6.5 1 1.2 1 2V17h6v-.3c0-.8.4-1.5 1-2A7 7 0 0 0 12 2z'
      ]}
    />
  )
}

export function OverviewIcon(): React.JSX.Element {
  return <Icon paths={['M4 20V11', 'M10 20V4', 'M16 20v-6', 'M22 20H2']} />
}

export function SettingsIcon(): React.JSX.Element {
  return (
    <Icon
      paths={[
        'M3 6h11',
        'M18 6h3',
        'M3 12h5',
        'M12 12h9',
        'M3 18h13',
        'M20 18h1',
        'M16 4v4',
        'M10 10v4',
        'M18 16v4'
      ]}
    />
  )
}

export function ImportIcon(): React.JSX.Element {
  return <Icon paths={['M12 3v12', 'M7 10l5 5 5-5', 'M4 20h16']} />
}

export function ChartsIcon(): React.JSX.Element {
  return <Icon paths={['M3 3v18h18', 'M7 15l4-5 3 3 5-7']} />
}
