import { getVarietyLabel } from "@/lib/kpi-dashboard/product-varieties"

export type FinanceProfitabilityRow = {
  variety_id: string
  profitability_percent: number
  updated_at: string
}

export function formatProfitabilityPercent(n: number): string {
  const x = Number(n)
  if (Number.isNaN(x)) return "0%"
  return `${x.toLocaleString(undefined, { maximumFractionDigits: 1, minimumFractionDigits: 0 })}%`
}

/**
 * Headline = variety with highest profitability %; details = 2nd and 3rd by the same measure.
 */
export function deriveFinanceProfitabilityFromDbRows(
  rows: FinanceProfitabilityRow[]
): { value: string; unit: string; details: string; lastUpdated: string } | null {
  if (rows.length === 0) return null

  const merged = new Map<string, number>()
  let lastUpdated = rows[0].updated_at
  for (const r of rows) {
    const p = Number(r.profitability_percent)
    if (Number.isNaN(p)) continue
    merged.set(r.variety_id, p)
    if (new Date(r.updated_at) > new Date(lastUpdated)) lastUpdated = r.updated_at
  }

  if (merged.size === 0) {
    return {
      value: "—",
      unit: "",
      details: "Record profitability per variety in the table on the metric page.",
      lastUpdated,
    }
  }

  const sorted = [...merged.entries()].sort((a, b) => {
    const diff = b[1] - a[1]
    if (diff !== 0) return diff
    return a[0].localeCompare(b[0])
  })

  const [topId, topP] = sorted[0]
  const rest = sorted.slice(1, 3)
  const details =
    rest.length > 0
      ? rest
          .map(([id, p], i) => {
            const rank = i + 2
            const ord = rank === 2 ? "2nd" : "3rd"
            return `${ord}: ${getVarietyLabel(id)} (${formatProfitabilityPercent(p)})`
          })
          .join(" · ")
      : "No additional varieties ranked below the top."

  return {
    value: getVarietyLabel(topId),
    unit: formatProfitabilityPercent(topP),
    details,
    lastUpdated,
  }
}
