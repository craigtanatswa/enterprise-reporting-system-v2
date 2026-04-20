import { getVarietyLabel } from "@/lib/kpi-dashboard/product-varieties"

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
