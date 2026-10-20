// Small "i" that shows an explanation when hovered or focused.
type InfoTipProps = {
  text: string
}

export function InfoTip({ text }: InfoTipProps): React.JSX.Element {
  return (
    <span className="infoTip" tabIndex={0} role="img" aria-label={text} data-tip={text}>
      i
    </span>
  )
}
