// Turns an insight fact into a Dutch sentence.
import { categoryLabel } from '@shared/categoryIcons'
import { formatMonthLabel } from '@shared/dates'
import type { InsightFact } from '@shared/insightTypes'
import { formatCents } from '@shared/money'
import type { Category } from '@shared/types'

const weekdayNames = [
  'zondag',
  'maandag',
  'dinsdag',
  'woensdag',
  'donderdag',
  'vrijdag',
  'zaterdag'
]

export function describeFact(fact: InsightFact, categories: Category[]): string {
  switch (fact.kind) {
    case 'averagePerMonth':
      return `Je gaf gemiddeld ${formatCents(fact.cents)} per maand uit, gerekend over ${plural(fact.months, 'maand', 'maanden')}.`
    case 'priciestMonth':
      return `${formatMonthLabel(fact.month)} was je duurste maand: je gaf toen ${formatCents(fact.cents)} uit.`
    case 'cheapestMonth':
      return `${formatMonthLabel(fact.month)} was je voordeligste maand: je gaf toen maar ${formatCents(fact.cents)} uit.`
    case 'biggestCategory':
      return `De meeste uitgaven gingen naar ${categoryName(fact.categoryId, categories)}: ${formatCents(fact.cents)}, ofwel ${fact.percent}% van al je uitgaven.`
    case 'mostVisitedCounterparty':
      return `Je betaalde ${fact.count} keer aan ${fact.name}, samen ${formatCents(fact.totalCents)}.`
    case 'busiestWeekday':
      return `Op ${weekdayNames[fact.weekday]} geef je het meeste uit: samen ${formatCents(fact.cents)}.`
    case 'savingsRate':
      return fact.percent >= 0
        ? `Je hield ${fact.percent}% van je inkomsten over: ${formatCents(fact.savedCents)}.`
        : `Je gaf ${-fact.percent}% meer uit dan je verdiende: ${formatCents(-fact.savedCents)} meer.`
    case 'uncategorized':
      return `${plural(fact.count, 'uitgave heeft', 'uitgaven hebben')} nog geen categorie. Met een categorie wordt dit overzicht nauwkeuriger.`
  }
}

export function categoryName(categoryId: string, categories: Category[]): string {
  const category = categories.find((candidate) => candidate.id === categoryId)
  return category ? categoryLabel(category) : 'Onbekend'
}

function plural(count: number, one: string, many: string): string {
  return `${count} ${count === 1 ? one : many}`
}
