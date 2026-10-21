// Calls onDismiss on a click outside the element or on Escape, but only while active (an open menu).
import { useEffect, type RefObject } from 'react'

export function useDismiss(
  element: RefObject<HTMLElement | null>,
  active: boolean,
  onDismiss: () => void
): void {
  useEffect(() => {
    if (!active) return
    const dismissOnOutsideClick = (event: MouseEvent): void => {
      if (!element.current?.contains(event.target as Node)) onDismiss()
    }
    const dismissOnEscape = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') onDismiss()
    }
    document.addEventListener('mousedown', dismissOnOutsideClick)
    document.addEventListener('keydown', dismissOnEscape)
    return () => {
      document.removeEventListener('mousedown', dismissOnOutsideClick)
      document.removeEventListener('keydown', dismissOnEscape)
    }
  }, [element, active, onDismiss])
}
