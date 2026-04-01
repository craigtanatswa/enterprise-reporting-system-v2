import { KpiDashboardContainer } from "@/components/kpi-dashboard/kpi-dashboard-container"
import { createClient } from "@/lib/supabase/server"
import {
  canViewAllKpiSegments,
  getKpiSegmentForProfile,
} from "@/lib/kpi-dashboard/segment-map"
import type { Department, SubDepartment } from "@/lib/utils/permissions"
import type { UserRole } from "@/lib/utils/permissions"
import { redirect } from "next/navigation"
import { Suspense } from "react"

export default async function KpiHomePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/auth/login")

  const { data: profile } = await supabase.from("profiles").select("role, department, sub_department, is_active").eq("id", user.id).single()
  if (!profile?.is_active) redirect("/auth/verify-email?error=pending-approval")

  const role = profile.role as UserRole
  const segment = getKpiSegmentForProfile(profile.department as Department, profile.sub_department as SubDepartment | null)
  const allowed = segment !== null || canViewAllKpiSegments(role)
  if (!allowed) redirect("/dashboard")

  return (
    <Suspense fallback={<p className="text-sm text-muted-foreground">Loading dashboard…</p>}>
      <KpiDashboardContainer />
    </Suspense>
  )
}
