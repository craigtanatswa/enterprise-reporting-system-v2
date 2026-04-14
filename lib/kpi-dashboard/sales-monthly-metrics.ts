import { getVarietyLabel } from "@/lib/kpi-dashboard/product-varieties"

export type RevenueMonthlyRow = { month: number; amount_usd: number; updated_at: string }

export type VolumeMonthlyRow = {
  month: number
  variety_id: string
  volume_tonnes: number
  updated_at: string
}

/** Calendar YTD: sum revenue for `year` through `referenceMonth` inclusive. */
export function deriveSalesRevenueYtd(
  rows: RevenueMonthlyRow[],
  year: number,
  reference: Date
): { ytd: number; lastUpdated: string } | null {
  if (rows.length === 0) return null
  const refY = reference.getFullYear()
  const refM = reference.getMonth() + 1
  if (year !== refY) return null
  let ytd = 0
  for (const r of rows) {
    if (r.month <= refM) ytd += Number(r.amount_usd)
  }
  const lastUpdated = rows.reduce(
    (latest, r) => (new Date(r.updated_at) > new Date(latest) ? r.updated_at : latest),
    rows[0].updated_at
  )
  return { ytd, lastUpdated }
}

/** YTD volume mix through `reference` month; main headline = top share %. */
export function deriveVolumeVarietyKpi(
  rows: VolumeMonthlyRow[],
  year: number,
  reference: Date
): { value: string; details: string; lastUpdated: string } | null {
  if (rows.length === 0) return null
  const refY = reference.getFullYear()
  const refM = reference.getMonth() + 1
  if (year !== refY) return null

  const byVar = new Map<string, number>()
  let lastUpdated = rows[0].updated_at
  for (const r of rows) {
    if (r.month > refM) continue
    const add = Number(r.volume_tonnes)
    if (Number.isNaN(add)) continue
    byVar.set(r.variety_id, (byVar.get(r.variety_id) ?? 0) + add)
    if (new Date(r.updated_at) > new Date(lastUpdated)) lastUpdated = r.updated_at
  }

  const total = [...byVar.values()].reduce((a, b) => a + b, 0)
  if (total <= 0) return null

  const sorted = [...byVar.entries()].sort((a, b) => b[1] - a[1])
  const [topId, topVol] = sorted[0]
  const pct = (topVol / total) * 100
  const details = sorted
    .map(([id, vol]) => `${getVarietyLabel(id)}: ${((vol / total) * 100).toFixed(1)}%`)
    .join(" | ")

  return {
    value: `${getVarietyLabel(topId)}: ${pct.toFixed(1)}%`,
    details,
    lastUpdated,
  }
}
