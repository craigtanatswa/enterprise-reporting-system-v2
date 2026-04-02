import { DashboardKpiRoot } from "@/components/dashboard/dashboard-kpi-root"
import { createClient } from "@/lib/supabase/server"
import { loadKpiDashboardState } from "@/lib/kpi-dashboard/merge-server"
import {
  canUpdateDepartmentKpi,
  canViewAllKpiSegments,
  getKpiSegmentForProfile,
} from "@/lib/kpi-dashboard/segment-map"
import { redirect } from "next/navigation"
import type React from "react"
import type { Department, SubDepartment } from "@/lib/utils/permissions"
import type { UserRole } from "@/lib/utils/permissions"
import { canViewConfidentialReports, isManagingDirector } from "@/lib/utils/permissions"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

  if (!profile) {
    await supabase.auth.signOut()
    redirect("/auth/login")
  }

  if (!profile.is_active) {
    redirect("/auth/verify-email?error=pending-approval")
  }

  const role = profile.role as UserRole
  const dept = profile.department as Department
  const sub = profile.sub_department as SubDepartment | null
  const segment = getKpiSegmentForProfile(dept, sub)
  const kpiEnabled = segment !== null || canViewAllKpiSegments(role)

  const kpiState = kpiEnabled ? await loadKpiDashboardState(supabase) : null

  const viewerIsFactoryStaff = dept === "OPERATIONS" && sub === "FACTORY"
  const viewerFactoryObserverMode = canViewConfidentialReports(role) && !viewerIsFactoryStaff

  return (
    <DashboardKpiRoot
      kpiEnabled={kpiEnabled}
      departments={kpiState?.departments ?? []}
      mdComments={kpiState?.mdComments ?? []}
      hasFullKpiAccess={canViewAllKpiSegments(role)}
      viewerIsMd={isManagingDirector(role)}
      primarySegment={segment}
      canEditDepartmentMetrics={canUpdateDepartmentKpi(role)}
      viewerIsFactoryStaff={viewerIsFactoryStaff}
      viewerFactoryObserverMode={viewerFactoryObserverMode}
    >
      {children}
    </DashboardKpiRoot>
  )
}
