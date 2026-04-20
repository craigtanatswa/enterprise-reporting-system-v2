import { getVarietyLabel, SALES_PRODUCT_VARIETIES } from "@/lib/kpi-dashboard/product-varieties"

export type AgronomyVarietyDbRow = {
  variety_id: string
  hectares_planned: number | string | null
  hectares_planted: number | string | null
  expected_yield_tonnes: number | string | null
  actual_yield_tonnes: number | string | null
  yield_per_hectare: number | string | null
  crop_progress_status: string | null
  variety_performance: string | null
  input_cost_per_hectare: number | string | null
  weather_risk_level?: string | null
  updated_at: string
}

export type AgronomyVarietyData = {
  variety_id: string
  hectares_planned: number
  hectares_planted: number
  expected_yield_tonnes: number
  actual_yield_tonnes: number
  yield_per_hectare: number
  crop_progress_status: string
  variety_performance: string
  input_cost_per_hectare: number
  /** One of WEATHER_RISK_LEVELS or "" when unset. */
  weather_risk_level: string
  updated_at: string
}

function num(v: number | string | null | undefined): number {
  const x = Number(v)
  return Number.isFinite(x) ? x : 0
}

export const WEATHER_RISK_LEVELS = ["Low", "Moderate", "High", "Extreme"] as const
export type WeatherRiskLevel = (typeof WEATHER_RISK_LEVELS)[number]

export function normalizeWeatherRiskLevel(s: string | null | undefined): string {
  const t = (s ?? "").trim()
  return (WEATHER_RISK_LEVELS as readonly string[]).includes(t) ? t : ""
}

export function normalizeAgronomyVarietyRow(r: AgronomyVarietyDbRow): AgronomyVarietyData {
  return {
    variety_id: r.variety_id,
    hectares_planned: num(r.hectares_planned),
    hectares_planted: num(r.hectares_planted),
    expected_yield_tonnes: num(r.expected_yield_tonnes),
    actual_yield_tonnes: num(r.actual_yield_tonnes),
    yield_per_hectare: num(r.yield_per_hectare),
    crop_progress_status: (r.crop_progress_status ?? "").trim(),
    variety_performance: (r.variety_performance ?? "").trim(),
    input_cost_per_hectare: num(r.input_cost_per_hectare),
    weather_risk_level: normalizeWeatherRiskLevel(r.weather_risk_level),
    updated_at: r.updated_at,
  }
}

function maxUpdated(rows: AgronomyVarietyData[]): string {
  let t = rows[0]?.updated_at ?? new Date().toISOString()
  for (const r of rows) {
    if (new Date(r.updated_at) > new Date(t)) t = r.updated_at
  }
  return t
}

function fmtNum(n: number, maxFrac = 2): string {
  if (!Number.isFinite(n)) return "0"
  return n.toLocaleString(undefined, { maximumFractionDigits: maxFrac })
}

/** Total hectares planted vs planned (all varieties). */
export function deriveAgroHectares(rows: AgronomyVarietyData[]): {
  value: string
  unit: string
  details: string
  lastUpdated: string
} | null {
  if (rows.length === 0) return null
  const planted = rows.reduce((s, r) => s + r.hectares_planted, 0)
  const planned = rows.reduce((s, r) => s + r.hectares_planned, 0)
  const details =
    planned > 0
      ? `Coverage: ${fmtNum((planted / planned) * 100, 1)}% of planned area (sum of varieties).`
      : "Enter planned and planted hectares per variety below."
  return {
    value: `${fmtNum(planted, 2)} / ${fmtNum(planned, 2)}`,
    unit: "ha",
    details,
    lastUpdated: maxUpdated(rows),
  }
}

/** Expected vs actual yield (tonnes, summed). */
export function deriveAgroYield(rows: AgronomyVarietyData[]): {
  value: string
  unit: string
  details: string
  lastUpdated: string
} | null {
  if (rows.length === 0) return null
  const exp = rows.reduce((s, r) => s + r.expected_yield_tonnes, 0)
  const act = rows.reduce((s, r) => s + r.actual_yield_tonnes, 0)
  const details =
    exp > 0 ? `Variance vs expected: ${fmtNum(act - exp, 2)} tonnes.` : "Enter expected and actual yield per variety below."
  return {
    value: `${fmtNum(exp, 2)} / ${fmtNum(act, 2)}`,
    unit: "tonnes",
    details,
    lastUpdated: maxUpdated(rows),
  }
}

const VARIETY_ORDER = new Map(SALES_PRODUCT_VARIETIES.map((v, i) => [v.id, i]))

/** Pick the variety with the highest t/ha; ties broken by product list order. */
function pickMaxYieldPerHa(
  rows: AgronomyVarietyData[],
  score: (r: AgronomyVarietyData) => number | null
): { y: number; id: string } | null {
  let best: { y: number; id: string } | null = null
  for (const r of rows) {
    const y = score(r)
    if (y === null || !Number.isFinite(y) || y <= 0) continue
    if (!best || y > best.y) {
      best = { y, id: r.variety_id }
      continue
    }
    if (y === best.y) {
      const iNew = VARIETY_ORDER.get(r.variety_id) ?? 999
      const iOld = VARIETY_ORDER.get(best.id) ?? 999
      if (iNew < iOld) best = { y, id: r.variety_id }
    }
  }
  return best
}

/**
 * Dashboard headline = highest yield/ha among varieties (best performer).
 * Uses stored t/ha when any row has it; otherwise highest implied actual ÷ planted.
 */
export function deriveAgroYieldPerHa(rows: AgronomyVarietyData[]): {
  value: number
  unit: string
  details: string
  lastUpdated: string
} | null {
  if (rows.length === 0) return null

  const fromStored = pickMaxYieldPerHa(rows, (r) => (r.yield_per_hectare > 0 ? r.yield_per_hectare : null))
  if (fromStored) {
    return {
      value: fromStored.y,
      unit: "tonnes/ha",
      details: `Peak yield / ha: ${getVarietyLabel(fromStored.id)} (${fmtNum(fromStored.y, 2)} t/ha).`,
      lastUpdated: maxUpdated(rows),
    }
  }

  const fromImplied = pickMaxYieldPerHa(rows, (r) => {
    if (r.hectares_planted <= 0 || r.actual_yield_tonnes <= 0) return null
    const y = r.actual_yield_tonnes / r.hectares_planted
    return Number.isFinite(y) && y > 0 ? y : null
  })
  if (fromImplied) {
    return {
      value: fromImplied.y,
      unit: "tonnes/ha",
      details: `Peak implied t/ha (actual ÷ planted): ${getVarietyLabel(fromImplied.id)} (${fmtNum(fromImplied.y, 2)} t/ha).`,
      lastUpdated: maxUpdated(rows),
    }
  }

  return {
    value: 0,
    unit: "tonnes/ha",
    details: "Enter yield per hectare per variety on the metric page.",
    lastUpdated: maxUpdated(rows),
  }
}

/** Summarise crop progress statuses across varieties. */
export function deriveAgroCropProgress(rows: AgronomyVarietyData[]): {
  value: string
  unit?: string
  details: string
  lastUpdated: string
} | null {
  if (rows.length === 0) return null
  const counts = new Map<string, number>()
  let withStatus = 0
  for (const r of rows) {
    const s = r.crop_progress_status.trim()
    if (!s) continue
    withStatus++
    counts.set(s, (counts.get(s) ?? 0) + 1)
  }
  if (withStatus === 0) {
    return {
      value: "—",
      details: "Set a progress status per variety in the table below.",
      lastUpdated: maxUpdated(rows),
    }
  }
  const sorted = [...counts.entries()].sort((a, b) => b[1] - a[1])
  const top = sorted[0]
  const rest = sorted
    .slice(1, 4)
    .map(([k, n]) => `${k}: ${n}`)
    .join(" · ")
  return {
    value: top[0],
    details: `${top[1]} of ${withStatus} tracked varieties in this stage.${rest ? ` Also: ${rest}.` : ""}`,
    lastUpdated: maxUpdated(rows),
  }
}

/** Average input cost per hectare, weighted by planted area. */
export function deriveAgroInputCostPerHa(rows: AgronomyVarietyData[]): {
  value: number
  unit: string
  details: string
  lastUpdated: string
} | null {
  if (rows.length === 0) return null
  let numW = 0
  let den = 0
  for (const r of rows) {
    if (r.hectares_planted > 0 && r.input_cost_per_hectare > 0) {
      numW += r.input_cost_per_hectare * r.hectares_planted
      den += r.hectares_planted
    }
  }
  if (den === 0) {
    return {
      value: 0,
      unit: "USD/ha",
      details: "Enter planted hectares and input cost per hectare per variety below.",
      lastUpdated: maxUpdated(rows),
    }
  }
  return {
    value: numW / den,
    unit: "USD/ha",
    details: `Weighted by planted hectares (${fmtNum(den, 2)} ha with cost data).`,
    lastUpdated: maxUpdated(rows),
  }
}

const WEATHER_RISK_RANK: Record<string, number> = {
  Low: 1,
  Moderate: 2,
  High: 3,
  Extreme: 4,
}

/** Dashboard headline = worst (highest) risk among varieties with a level set. */
export function deriveAgroWeatherRisk(rows: AgronomyVarietyData[]): {
  value: string
  details: string
  lastUpdated: string
} | null {
  if (rows.length === 0) return null
  const assessed = rows
    .map((r) => ({ id: r.variety_id, level: normalizeWeatherRiskLevel(r.weather_risk_level) }))
    .filter((x) => x.level !== "")

  if (assessed.length === 0) return null

  let worst = assessed[0]!
  let worstRank = WEATHER_RISK_RANK[worst.level] ?? 0
  for (const x of assessed.slice(1)) {
    const rnk = WEATHER_RISK_RANK[x.level] ?? 0
    if (rnk > worstRank) {
      worst = x
      worstRank = rnk
    } else if (rnk === worstRank) {
      const iNew = VARIETY_ORDER.get(x.id) ?? 999
      const iOld = VARIETY_ORDER.get(worst.id) ?? 999
      if (iNew < iOld) worst = x
    }
  }

  const sameWorst = assessed.filter((x) => (WEATHER_RISK_RANK[x.level] ?? 0) === worstRank)
  const names = sameWorst.slice(0, 4).map((x) => getVarietyLabel(x.id)).join(", ")
  const extra = sameWorst.length > 4 ? ` (+${sameWorst.length - 4} more)` : ""

  return {
    value: worst.level,
    details: `Highest assigned risk: ${worst.level}. ${assessed.length} variet${assessed.length === 1 ? "y" : "ies"} rated. In this tier: ${names}${extra}.`,
    lastUpdated: maxUpdated(rows),
  }
}

export const AGRONOMY_VARIETY_TABLE_METRIC_IDS = [
  "agro-hectares",
  "agro-yield",
  "agro-yield-per-ha",
  "agro-crop-progress",
  "agro-input-cost",
  "agro-weather-risk",
] as const

export type AgronomyVarietyTableMetricId = (typeof AGRONOMY_VARIETY_TABLE_METRIC_IDS)[number]

export function isAgronomyVarietyTableMetric(id: string): id is AgronomyVarietyTableMetricId {
  return (AGRONOMY_VARIETY_TABLE_METRIC_IDS as readonly string[]).includes(id)
}

/** Suggested values for crop progress (stored as plain text). */
export const CROP_PROGRESS_OPTIONS = [
  "Planning",
  "Land preparation",
  "Planting",
  "Vegetative",
  "Flowering / grain fill",
  "Harvest",
  "Complete",
  "Delayed",
] as const
