// Decides whether to offer a new rule after a manual categorisation.
import { useCallback, useState } from 'react'
import { hasRuleFor, proposeRule, type RuleOffer } from '@shared/ruleOffer'
import type { Transaction } from '@shared/types'
import { api } from '../api'

export function useRuleOffer(): {
  offer: RuleOffer | null
  propose: (categorised: Transaction[], categoryId: string | null) => Promise<void>
  dismiss: () => void
} {
  const [offer, setOffer] = useState<RuleOffer | null>(null)

  const propose = useCallback(async (categorised: Transaction[], categoryId: string | null) => {
    const proposal = categoryId === null ? null : proposeRule(categorised, categoryId)
    if (proposal === null) return setOffer(null)
    const rules = await api.rules.get().catch(() => null)
    setOffer(rules !== null && !hasRuleFor(proposal, rules) ? proposal : null)
  }, [])

  const dismiss = useCallback(() => setOffer(null), [])

  return { offer, propose, dismiss }
}
