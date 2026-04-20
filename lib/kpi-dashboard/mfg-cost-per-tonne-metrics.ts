import { getVarietyLabel } from "@/lib/kpi-dashboard/product-varieties"

export type MfgCostPerTonneDbRow = {
  variety_id: string
  cost_usd_per_tonne: number
  target_usd_per_tonne: number
  updated_at: string
}

type ProcessedMonthRow = { month: number; variety_id: string; tonnes_processed: number }

function ytdTonnesByVariety(processedRows: ProcessedMonthRow[], reference: Date): Map<string, number> {
  const refM = reference.getMonth() + 1
  const m = new Map<string, number>()
  for (const r of processedRows) {
    if (r.month > refM) continue
    const add = Number(r.tonnes_processed)
    if (Number.isNaN(add) || add <= 0) continue
    const vid = r.variety_id
    m.set(vid, (m.get(vid) ?? 0) + add)
  }
  return m
}

function fmtUsd(n: number): string {
  return n.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })
}

/**
 * Headline = variety with the highest actual cost per tonne (among rows with cost &gt; 0).
 * Details list all varieties with actual vs target and optional YTD processed tonnes.
 */
export function deriveMfgCostPerTonneKpi(
  costRows: MfgCostPerTonneDbRow[],
  processedRows: ProcessedMonthRow[] | null,
  reference: Date
): { value: string; details: string; lastUpdated: string } | null {
  if (costRows.length === 0) return null

  let lastUpdated = costRows[0].updated_at
  const rows: { id: string; cost: number; target: number }[] = []
  for (const r of costRows) {
    if (new Date(r.updated_at) > new Date(lastUpdated)) lastUpdated = r.updated_at
    const cost = Number(r.cost_usd_per_tonne)
    const target = Number(r.target_usd_per_tonne)
    if (Number.isNaN(cost) || cost < 0) continue
    rows.push({
      id: r.variety_id,
      cost,
      target: Number.isNaN(target) || target < 0 ? 0 : target,
    })
  }

  const positive = rows.filter((x) => x.cost > 0)
  if (positive.length === 0) return null

  positive.sort((a, b) => {
    if (b.cost !== a.cost) return b.cost - a.cost
    return a.id.localeCompare(b.id)
  })

  const top = positive[0]
  const ytd =
    processedRows && processedRows.length > 0 ? ytdTonnesByVariety(processedRows, reference) : new Map<string, number>()

  const detailLines = positive.map(({ id, cost, target }) => {
    const label = getVarietyLabel(id)
    const t = ytd.get(id) ?? 0
    const ytdPart = t > 0 ? `; ${fmtUsd(t)} t YTD processed` : ""
    return `${label}: $${fmtUsd(cost)}/t actual, target $${fmtUsd(target)}/t${ytdPart}`
  })

  const rest = positive.slice(1, 4)
  const restSummary =
    rest.length > 0
      ? " Next highest: " +
        rest.map((x, i) => `${i + 2}) ${getVarietyLabel(x.id)} $${fmtUsd(x.cost)}/t`).join(" · ")
      : ""

  const details =
    `Highest unit cost among varieties with recorded actuals.${restSummary} Full list: ` + detailLines.join(" | ")

  return {
    value: `${getVarietyLabel(top.id)}: $${fmtUsd(top.cost)}/t`,
    details,
    lastUpdated,
  }
}
