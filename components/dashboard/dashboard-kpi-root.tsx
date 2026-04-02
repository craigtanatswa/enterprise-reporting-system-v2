"use client"

import type React from "react"
import { DashboardShell } from "@/components/dashboard/dashboard-shell"
import { KpiDashboardProvider } from "@/components/kpi-dashboard/kpi-dashboard-provider"
import type { DepartmentData, MDComment } from "@/lib/kpi-dashboard/types"

export function DashboardKpiRoot({
  children,
  kpiEnabled,
  departments,
  mdComments,
  hasFullKpiAccess,
  viewerIsMd,
  hideExecutiveOverviewInKpiNav,
  primarySegment,
  canEditDepartmentMetrics,
}: {
  children: React.ReactNode
  kpiEnabled: boolean
  departments: DepartmentData[]
  mdComments: MDComment[]
  hasFullKpiAccess: boolean
  viewerIsMd: boolean
  hideExecutiveOverviewInKpiNav: boolean
  primarySegment: string | null
  canEditDepartmentMetrics: boolean
}) {
  return (
    <KpiDashboardProvider
      kpiEnabled={kpiEnabled}
      departments={departments}
      mdComments={mdComments}
      hasFullKpiAccess={hasFullKpiAccess}
      viewerIsMd={viewerIsMd}
      hideExecutiveOverviewInKpiNav={hideExecutiveOverviewInKpiNav}
      primarySegment={primarySegment}
      canEditDepartmentMetrics={canEditDepartmentMetrics}
    >
      <DashboardShell>{children}</DashboardShell>
    </KpiDashboardProvider>
  )
}
