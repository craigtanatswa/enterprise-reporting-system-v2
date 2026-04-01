"use client"

import { useRouter } from "next/navigation"
import { Plus } from "lucide-react"
import { KpiMetricCard } from "@/components/kpi-dashboard/metric-card"
import { Button } from "@/components/ui/button"
import { useKpiDashboard } from "@/components/kpi-dashboard/kpi-dashboard-provider"
import type { DepartmentData } from "@/lib/kpi-dashboard/types"

export function KpiDepartmentDashboard({ department }: { department: DepartmentData }) {
  const router = useRouter()
  const { canEditDepartmentMetrics } = useKpiDashboard()

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{department.name}</h1>
          <p className="text-muted-foreground">Managed by: {department.head}</p>
        </div>
        {canEditDepartmentMetrics && (
          <Button onClick={() => router.push(`/dashboard/kpi/data-entry/${department.id}`)} className="gap-2">
            <Plus className="size-4" />
            Update Metrics
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {department.metrics.map((metric) => (
          <KpiMetricCard
            key={metric.id}
            metric={metric}
            onClick={() => router.push(`/dashboard/kpi/metric/${department.id}/${metric.id}`)}
          />
        ))}
      </div>
    </div>
  )
}
