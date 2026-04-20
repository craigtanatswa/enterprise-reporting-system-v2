import { getVarietyLabel, SALES_PRODUCT_VARIETIES } from "@/lib/kpi-dashboard/product-varieties"

export type MfgRawSeedMonthlyRow = {
  month: number
  variety_id: string
  tonnes_received: number
  updated_at: string
}

const MONTH_NAMES = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
] as const

function fmtTonnes(n: number): string {
  return n.toLocaleString(undefined, { maximumFractionDigits: 2 })
}

/**
 * Headline = among varieties with positive YTD tonnes, the one whose rows were most recently saved
 * (max `updated_at` across that variety's rows in the year, any month). Value = that variety's cumulative
 * tonnes Jan–reference month. Details list all varieties' YTD totals.
 */
export function deriveMfgRawReceivedKpi(
  rows: MfgRawSeedMonthlyRow[],
  year: number,
  reference: Date
): { value: string; details: string; lastUpdated: string } | null {
  if (rows.length === 0) return null
  const refY = reference.getFullYear()
  const refM = reference.getMonth() + 1
  if (year !== refY) return null

  const ytdByVariety = new Map<string, number>()
  const lastTouchByVariety = new Map<string, string>()
  let globalLastUpdated = rows[0].updated_at

  for (const r of rows) {
    const vid = r.variety_id
    const prevTouch = lastTouchByVariety.get(vid)
    if (!prevTouch || new Date(r.updated_at) > new Date(prevTouch)) {
      lastTouchByVariety.set(vid, r.updated_at)
    }
    if (new Date(r.updated_at) > new Date(globalLastUpdated)) globalLastUpdated = r.updated_at

    if (r.month > refM) continue
    const add = Number(r.tonnes_received)
    if (Number.isNaN(add)) continue
    ytdByVariety.set(vid, (ytdByVariety.get(vid) ?? 0) + add)
  }

  const candidates = [...lastTouchByVariety.entries()].filter(([vid]) => (ytdByVariety.get(vid) ?? 0) > 0)
  if (candidates.length === 0) return null

  candidates.sort((a, b) => {
    const t = new Date(b[1]).getTime() - new Date(a[1]).getTime()
    if (t !== 0) return t
    const yA = ytdByVariety.get(a[0]) ?? 0
    const yB = ytdByVariety.get(b[0]) ?? 0
    if (yB !== yA) return yB - yA
    return a[0].localeCompare(b[0])
  })

  const [winId] = candidates[0]
  const winYtd = ytdByVariety.get(winId) ?? 0

  const detailLines = [...ytdByVariety.entries()]
    .filter(([, t]) => t > 0)
    .sort((a, b) => b[1] - a[1])
    .map(([id, t]) => `${getVarietyLabel(id)}: ${fmtTonnes(t)} t`)

  const details =
    detailLines.length > 0
      ? `Year-to-date through ${MONTH_NAMES[refM - 1]} ${year}: ` + detailLines.join(" | ")
      : ""

  return {
    value: `${getVarietyLabel(winId)}: ${fmtTonnes(winYtd)} tonnes`,
    details,
    lastUpdated: globalLastUpdated,
  }
}

/** Shared row shape for processed / packaged monthly tables (tonnes summed per variety). */
export type MfgVarietyTonnesMonthlyRow = {
  month: number
  variety_id: string
  tonnes: number
  updated_at: string
}

/**
 * Headline = total YTD tonnes (all varieties, Jan–reference month). Details = per-variety YTD breakdown.
 */
export function deriveMfgVarietyTonnesYtdTotals(
  rows: MfgVarietyTonnesMonthlyRow[],
  year: number,
  reference: Date
): { value: number; details: string; lastUpdated: string } | null {
  if (rows.length === 0) return null
  const refY = reference.getFullYear()
  const refM = reference.getMonth() + 1
  if (year !== refY) return null

  const ytdByVariety = new Map<string, number>()
  let globalLastUpdated = rows[0].updated_at

  for (const r of rows) {
    if (new Date(r.updated_at) > new Date(globalLastUpdated)) globalLastUpdated = r.updated_at
    if (r.month > refM) continue
    const add = Number(r.tonnes)
    if (Number.isNaN(add)) continue
    ytdByVariety.set(r.variety_id, (ytdByVariety.get(r.variety_id) ?? 0) + add)
  }

  const total = [...ytdByVariety.values()].reduce((a, b) => a + b, 0)
  if (total <= 0) return null

  const detailLines = [...ytdByVariety.entries()]
    .filter(([, t]) => t > 0)
    .sort((a, b) => b[1] - a[1])
    .map(([id, t]) => `${getVarietyLabel(id)}: ${fmtTonnes(t)} t`)

  const details =
    detailLines.length > 0
      ? `Year-to-date through ${MONTH_NAMES[refM - 1]} ${year}: ` + detailLines.join(" | ")
      : ""

  return {
    value: total,
    details,
    lastUpdated: globalLastUpdated,
  }
}

/**
 * Finished product in warehouse: each row is **closing tonnes** at end of that month (per variety).
 * Headline = total inventory on hand: sum over varieties of the forward-filled closing balance
 * at the end of the reference month (empty months carry forward the last entered snapshot).
 */
export function deriveMfgFinishedWarehouseInventoryKpi(
  rows: MfgVarietyTonnesMonthlyRow[],
  year: number,
  reference: Date
): { value: number; details: string; lastUpdated: string } | null {
  if (rows.length === 0) return null
  const refY = reference.getFullYear()
  const refM = reference.getMonth() + 1
  if (year !== refY) return null

  const byMonth = new Map<string, Map<number, number>>()
  let globalLastUpdated = rows[0].updated_at

  for (const r of rows) {
    if (new Date(r.updated_at) > new Date(globalLastUpdated)) globalLastUpdated = r.updated_at
    if (r.month > refM || r.month < 1) continue
    let inner = byMonth.get(r.variety_id)
    if (!inner) {
      inner = new Map()
      byMonth.set(r.variety_id, inner)
    }
    inner.set(r.month, Number(r.tonnes))
  }

  function closingTonnesAtEndOfMonth(varietyId: string, throughMonth: number): number {
    const cells = byMonth.get(varietyId)
    let last = 0
    for (let m = 1; m <= throughMonth; m++) {
      const t = cells?.get(m)
      if (t !== undefined && !Number.isNaN(t)) last = t
    }
    return last
  }

  const breakdown: { id: string; t: number }[] = []
  let total = 0
  for (const v of SALES_PRODUCT_VARIETIES) {
    const t = closingTonnesAtEndOfMonth(v.id, refM)
    total += t
    if (t > 0) breakdown.push({ id: v.id, t })
  }
  breakdown.sort((a, b) => b.t - a.t)

  const detailLines = breakdown.map((x) => `${getVarietyLabel(x.id)}: ${fmtTonnes(x.t)} t`)

  const details =
    detailLines.length > 0
      ? `Closing inventory end of ${MONTH_NAMES[refM - 1]} ${year}: ` + detailLines.join(" | ")
      : `Closing inventory end of ${MONTH_NAMES[refM - 1]} ${year}: no stock recorded.`

  return {
    value: total,
    details,
    lastUpdated: globalLastUpdated,
  }
}
