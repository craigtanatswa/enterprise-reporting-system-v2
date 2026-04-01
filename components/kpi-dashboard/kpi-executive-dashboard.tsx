"use client"

import { usePathname, useRouter } from "next/navigation"
import { KpiMetricCard } from "@/components/kpi-dashboard/metric-card"
import { KpiDepartmentScorecard } from "@/components/kpi-dashboard/department-scorecard"
import { useKpiDashboard } from "@/components/kpi-dashboard/kpi-dashboard-provider"
import { executiveMetricSources } from "@/lib/kpi-dashboard/initial-data"

export function KpiExecutiveDashboard() {
  const router = useRouter()
  const pathname = usePathname()
  const { departments, setSelectedDepartment, scorecard } = useKpiDashboard()

  const executive = departments.find((d) => d.id === "executive")
  if (!executive) return null

  const kpiBase = pathname.startsWith("/dashboard/md/kpi") ? "/dashboard/md/kpi" : "/dashboard/kpi"

  const handleMetricClick = (metricId: string) => {
    const sourceDepartment = executiveMetricSources[metricId]
    if (sourceDepartment) {
      setSelectedDepartment(sourceDepartment)
      router.push(`${kpiBase}?dept=${encodeURIComponent(sourceDepartment)}`)
    } else {
      router.push(`/dashboard/kpi/metric/executive/${metricId}`)
    }
  }

  const handleDepartmentClick = (departmentId: string) => {
    setSelectedDepartment(departmentId)
    router.push(`${kpiBase}?dept=${encodeURIComponent(departmentId)}`)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Executive Overview</h1>
        <p className="text-muted-foreground">Company-wide performance metrics and department status</p>
      </div>

      <KpiDepartmentScorecard scorecard={scorecard} onDepartmentClick={handleDepartmentClick} />

      <div>
        <h2 className="text-lg font-semibold mb-4">Key Performance Indicators</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {executive.metrics.map((metric) => (
            <KpiMetricCard key={metric.id} metric={metric} onClick={() => handleMetricClick(metric.id)} />
          ))}
        </div>
      </div>
    </div>
  )
}
