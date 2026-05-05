import type { DepartmentData, MetricData, MetricStatus } from "./types"

/** Procurement expenditure metrics: limit is stored in `target`; status is red when actual exceeds the limit. */
export function isMaxLimitMetric(metric: Pick<MetricData, "comparison">): boolean {
  return metric.comparison === "maxLimit"
}

export function deriveExpenditureLimitStatus(value: number, limit: number): MetricStatus {
  if (limit <= 0) return "green"
  return value > limit ? "red" : "green"
}

export function applyExpenditureLimitReconciliation(metric: MetricData): MetricData {
  if (!isMaxLimitMetric(metric) || metric.target == null || typeof metric.value !== "number") {
    return metric
  }
  return {
    ...metric,
    status: deriveExpenditureLimitStatus(metric.value, metric.target),
  }
}

export function reconcileExpenditureLimitsInDepartments(departments: DepartmentData[]): void {
  for (const d of departments) {
    for (let i = 0; i < d.metrics.length; i++) {
      d.metrics[i] = applyExpenditureLimitReconciliation(d.metrics[i])
    }
  }
}
