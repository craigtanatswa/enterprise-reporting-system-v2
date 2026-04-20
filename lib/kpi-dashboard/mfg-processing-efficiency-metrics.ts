import { getVarietyLabel } from "@/lib/kpi-dashboard/product-varieties"

export type MfgProcessingEfficiencyDbRow = {
  variety_id: string
  efficiency_percent: number
  target_percent: number
  updated_at: string
}

function fmtPct(n: number): string {
  const x = Number(n)
  if (Number.isNaN(x)) return "0"
  return x.toLocaleString(undefined, { maximumFractionDigits: 1 })
}

/**
 * Headline = variety with the lowest actual efficiency % (worst among varieties with actual &gt; 0).
 * Details list all varieties with actual vs target %.
 */
export function deriveMfgProcessingEfficiencyKpi(
  rows: MfgProcessingEfficiencyDbRow[]
): { value: string; details: string; lastUpdated: string } | null {
  if (rows.length === 0) return null

  let lastUpdated = rows[0].updated_at
  const list: { id: string; actual: number; target: number }[] = []
  for (const r of rows) {
    if (new Date(r.updated_at) > new Date(lastUpdated)) lastUpdated = r.updated_at
    const actual = Number(r.efficiency_percent)
    const target = Number(r.target_percent)
    if (Number.isNaN(actual) || actual < 0) continue
    list.push({
      id: r.variety_id,
      actual,
      target: Number.isNaN(target) || target < 0 ? 0 : target,
    })
  }

  const positive = list.filter((x) => x.actual > 0)
  if (positive.length === 0) return null

  positive.sort((a, b) => {
    if (a.actual !== b.actual) return a.actual - b.actual
    return a.id.localeCompare(b.id)
  })

  const worst = positive[0]
  const rest = positive.slice(1, 4)

  const detailLines = positive.map(({ id, actual, target }) => {
    const label = getVarietyLabel(id)
    return `${label}: ${fmtPct(actual)}% actual vs ${fmtPct(target)}% target`
  })

  const restSummary =
    rest.length > 0
      ? " Next lowest: " +
        rest.map((x, i) => `${i + 2}) ${getVarietyLabel(x.id)} ${fmtPct(x.actual)}%`).join(" · ")
      : ""

  const details =
    `Lowest actual efficiency among varieties with recorded actuals.${restSummary} Full list: ` +
    detailLines.join(" | ")

  return {
    value: `${getVarietyLabel(worst.id)}: ${fmtPct(worst.actual)}% (target ${fmtPct(worst.target)}%)`,
    details,
    lastUpdated,
  }
}
