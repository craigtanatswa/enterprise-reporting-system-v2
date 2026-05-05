/** Procurement KPI metrics that support a per-month numeric breakdown (stored in `kpi_procurement_metric_monthly`). */
export const PROCUREMENT_MONTHLY_METRIC_IDS = [
  "proc-capex",
  "proc-opex",
  "proc-total",
  "proc-credit",
  "proc-cash",
  "proc-reorder",
  "proc-savings",
] as const

export type ProcurementMonthlyMetricId = (typeof PROCUREMENT_MONTHLY_METRIC_IDS)[number]

export function isProcurementMonthlyMetricId(id: string): id is ProcurementMonthlyMetricId {
  return (PROCUREMENT_MONTHLY_METRIC_IDS as readonly string[]).includes(id)
}

export type ProcurementMonthlyRow = {
  metric_id: string
  month: number
  value_amount: number
  updated_at: string
}

/** Calendar YTD for the given metric: sum months 1..current month in `reference` when `year` matches. */
export function deriveProcurementMetricYtd(
  rows: ProcurementMonthlyRow[],
  metricId: string,
  year: number,
  reference: Date
): { ytd: number; lastUpdated: string } | null {
  const forMetric = rows.filter((r) => r.metric_id === metricId)
  if (forMetric.length === 0) return null
  const refY = reference.getFullYear()
  const refM = reference.getMonth() + 1
  if (year !== refY) return null
  let ytd = 0
  for (const r of forMetric) {
    if (r.month <= refM) ytd += Number(r.value_amount)
  }
  const lastUpdated = forMetric.reduce(
    (latest, r) => (new Date(r.updated_at) > new Date(latest) ? r.updated_at : latest),
    forMetric[0].updated_at
  )
  return { ytd, lastUpdated }
}
