// Non-blocking question after a manual categorisation: always use this category for this counterparty?
import { useState } from 'react'
import { buildRuleFromOffer, type RuleOffer } from '@shared/ruleOffer'
import { api } from '../api'
import { describeError } from '../errorMessages'
import { ReapplyRules } from './ReapplyRules'

type RuleOfferBannerProps = {
  offer: RuleOffer
  categoryName: string
  onDismiss: () => void
}

type Step = { name: 'ask' } | { name: 'saved' } | { name: 'error'; error: unknown }

export function RuleOfferBanner({
  offer,
  categoryName,
  onDismiss
}: RuleOfferBannerProps): React.JSX.Element {
  const [step, setStep] = useState<Step>({ name: 'ask' })

  const createRule = async (): Promise<void> => {
    try {
      const rules = await api.rules.get()
      await api.rules.save([...rules, buildRuleFromOffer(offer, crypto.randomUUID())])
      setStep({ name: 'saved' })
    } catch (error) {
      setStep({ name: 'error', error })
    }
  }

  return (
    <div className="offerBanner">
      {step.name === 'ask' && (
        <>
          <span>
            Altijd ‘{categoryName}’ gebruiken voor ‘{offer.counterpartyLabel}’?
          </span>
          <span className="inlineActions">
            <button onClick={createRule}>Regel maken</button>
            <button className="secondary" onClick={onDismiss}>
              Nee
            </button>
          </span>
        </>
      )}
      {step.name === 'saved' && (
        <>
          <span>Regel gemaakt.</span>
          <ReapplyRules refreshKey={0} />
          <button className="secondary" onClick={onDismiss}>
            Sluiten
          </button>
        </>
      )}
      {step.name === 'error' && (
        <>
          <span className="errorText">{describeError(step.error)}</span>
          <button className="secondary" onClick={onDismiss}>
            Sluiten
          </button>
        </>
      )}
    </div>
  )
}
