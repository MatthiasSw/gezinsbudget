// Tells which of the given sections is currently at the top of the scrolling page.
import { useEffect, useState } from 'react'

const topMarginPx = 90

export function useActiveSection(
  ids: readonly string[],
  enabled: boolean
): [string, (id: string) => void] {
  const [active, setActive] = useState(ids[0])

  useEffect(() => {
    if (!enabled) return
    const visible = new Set<string>()
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) visible.add(entry.target.id)
          else visible.delete(entry.target.id)
        }
        const first = ids.find((id) => visible.has(id))
        if (first) setActive(first)
      },
      { root: document.querySelector('main'), rootMargin: `-${topMarginPx}px 0px -50% 0px` }
    )
    for (const id of ids) {
      const element = document.getElementById(id)
      if (element) observer.observe(element)
    }
    return () => observer.disconnect()
  }, [ids, enabled])

  return [active, setActive]
}
