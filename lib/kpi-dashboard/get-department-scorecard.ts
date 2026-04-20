import type { DepartmentData, MetricStatus } from "./types"

/** Executive dashboard: per-department roll-up from KPI status counts (excludes synthetic executive segment). */
export function getDepartmentScorecard(departments: DepartmentData[]) {
  return departments
    .filter((d) => d.id !== "executive")
    .map((dept) => {
      const metrics = dept.metrics
      const greenCount = metrics.filter((m) => m.status === "green").length
      const amberCount = metrics.filter((m) => m.status === "amber").length
      const redCount = metrics.filter((m) => m.status === "red").length

      let overallStatus: MetricStatus = "green"
      if (redCount > 0) overallStatus = "red"
      else if (amberCount > greenCount) overallStatus = "amber"

      return {
        id: dept.id,
        name: dept.shortName,
        status: overallStatus,
        greenCount,
        amberCount,
        redCount,
      }
    })
}
