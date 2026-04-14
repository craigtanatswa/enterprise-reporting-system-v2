import { getVarietyLabel } from "@/lib/kpi-dashboard/product-varieties"

export type FinanceInventoryRow = {
  variety_id: string
  inventory_tonnes: number
  updated_at: string
}

export function formatTonnesDisplay(n: number): string {
  const x = Number(n)
  if (Number.isNaN(x)) return "0"
  if (Number.isInteger(x)) return String(x)
  return x.toLocaleString(undefined, { maximumFractionDigits: 2 })
}

/**
 * Headline = top variety by tonnes; details = 2nd–4th. Used when at least one row exists in DB.
 */
export function deriveFinanceInventoryLevelsFromDbRows(
  rows: FinanceInventoryRow[]
): { value: string; unit: string; details: string; lastUpdated: string } | null {
  if (rows.length === 0) return null

  const merged = new Map<string, number>()
  let lastUpdated = rows[0].updated_at
  for (const r of rows) {
    merged.set(r.variety_id, Number(r.inventory_tonnes) || 0)
    if (new Date(r.updated_at) > new Date(lastUpdated)) lastUpdated = r.updated_at
  }

  const sorted = [...merged.entries()].sort((a, b) => b[1] - a[1])
  const positive = sorted.filter(([, t]) => t > 0)
  const total = positive.reduce((s, [, t]) => s + t, 0)

  if (total <= 0) {
    return {
      value: "—",
      unit: "0 tonnes",
      details: "Record levels per variety in the table below.",
      lastUpdated,
    }
  }

  const [topId, topT] = positive[0]
  const rest = positive.slice(1, 4)
  const details = rest
    .map(([id, t], i) => {
      const rank = i + 2
      const ord = rank === 2 ? "2nd" : rank === 3 ? "3rd" : "4th"
      return `${ord}: ${getVarietyLabel(id)} (${formatTonnesDisplay(t)} t)`
    })
    .join(" · ")

  return {
    value: getVarietyLabel(topId),
    unit: `${formatTonnesDisplay(topT)} tonnes`,
    details,
    lastUpdated,
  }
}
