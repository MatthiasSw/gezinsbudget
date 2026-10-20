// Picks round axis bounds and ticks so the scale reads in clean numbers.
export type NiceAxis = {
  domain: [number, number]
  ticks: number[]
}

const targetTickCount = 4
const stepBases = [1, 2, 2.5, 5, 10]

export function niceAxis(minValue: number, maxValue: number): NiceAxis {
  const low = Math.min(minValue, 0)
  const high = Math.max(maxValue, 0)
  const step = niceStep((high - low) / targetTickCount)
  const lowTick = Math.floor(low / step) * step
  const highTick = Math.max(Math.ceil(high / step) * step, lowTick + step)
  const ticks: number[] = []
  for (let tick = lowTick; tick <= highTick + step / 2; tick += step) ticks.push(tick)
  return { domain: [lowTick, highTick], ticks }
}

function niceStep(rawStep: number): number {
  if (rawStep <= 0) return 100
  const magnitude = Math.pow(10, Math.floor(Math.log10(rawStep)))
  const base = stepBases.find((candidate) => candidate * magnitude >= rawStep) ?? 10
  return base * magnitude
}
