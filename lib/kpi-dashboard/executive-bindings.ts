/**
 * Each executive KPI mirrors one concrete department metric (read-time sync in `merge-server`).
 */
export const executiveMetricSourceDetail: Record<string, { segmentId: string; metricId: string }> = {
  "exec-revenue": { segmentId: "sales-marketing", metricId: "sales-revenue" },
  "exec-gross-profit": { segmentId: "finance", metricId: "fin-gross-margin" },
  "exec-net-profit": { segmentId: "finance", metricId: "fin-net-margin" },
  "exec-sales-volume": { segmentId: "sales-marketing", metricId: "sales-target-actual" },
  "exec-production-alignment": { segmentId: "operations-manufacturing", metricId: "mfg-efficiency" },
  "exec-inventory-value": { segmentId: "inventory", metricId: "inv-stock-value" },
  "exec-cash-flow": { segmentId: "finance", metricId: "fin-cash-flow" },
  "exec-debtors": { segmentId: "finance", metricId: "fin-debtors-aging" },
  "exec-top-product": { segmentId: "sales-marketing", metricId: "sales-volume-variety" },
}

/** When a department metric is saved, any executive metrics that should refresh from it. */
export function getExecutiveMetricIdsFedByDepartmentMetric(
  segmentId: string,
  metricId: string
): string[] {
  const out: string[] = []
  for (const [execId, src] of Object.entries(executiveMetricSourceDetail)) {
    if (src.segmentId === segmentId && src.metricId === metricId) {
      out.push(execId)
    }
  }
  return out
}
