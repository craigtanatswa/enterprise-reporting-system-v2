"use client"

import { useEffect } from "react"
import { usePathname, useSearchParams } from "next/navigation"
import { KpiExecutiveDashboard } from "@/components/kpi-dashboard/kpi-executive-dashboard"
import { KpiDepartmentDashboard } from "@/components/kpi-dashboard/kpi-department-dashboard"
import { useKpiDashboard } from "@/components/kpi-dashboard/kpi-dashboard-provider"

export function KpiDashboardContainer() {
  const { selectedDepartment, setSelectedDepartment, getDepartment, hasFullKpiAccess, primarySegment } =
    useKpiDashboard()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    const d = searchParams.get("dept")
    if (d && getDepartment(d)) {
      setSelectedDepartment(d)
      return
    }
    // MD executive route without ?dept= must show full executive overview (avoid stale manufacturing selection).
    if (pathname.startsWith("/dashboard/md/kpi")) {
      setSelectedDepartment("executive")
      return
    }
    if (pathname === "/dashboard/kpi" && hasFullKpiAccess) {
      setSelectedDepartment("executive")
    }
  }, [pathname, searchParams, getDepartment, setSelectedDepartment, hasFullKpiAccess])

  if (selectedDepartment === "executive") {
    if (hasFullKpiAccess) {
      return <KpiExecutiveDashboard />
    }
    const dept = primarySegment ? getDepartment(primarySegment) : undefined
    return dept ? <KpiDepartmentDashboard department={dept} /> : null
  }

  const department = getDepartment(selectedDepartment)
  if (!department) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Department not found</p>
      </div>
    )
  }

  return <KpiDepartmentDashboard department={department} />
}
