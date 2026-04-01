import { KpiDashboardContainer } from "@/components/kpi-dashboard/kpi-dashboard-container"
import { createClient } from "@/lib/supabase/server"
import type { UserRole } from "@/lib/utils/permissions"
import { redirect } from "next/navigation"
import { Suspense } from "react"

export default async function MdKpiExecutivePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/auth/login")

  const { data: profile } = await supabase.from("profiles").select("role, is_active").eq("id", user.id).single()
  if (!profile?.is_active) redirect("/auth/verify-email?error=pending-approval")

  const role = profile.role as UserRole
  if (role !== "MANAGING_DIRECTOR" && role !== "ADMIN" && role !== "BOOTSTRAP_ADMIN") {
    redirect("/dashboard/kpi")
  }

  return (
    <Suspense fallback={<p className="text-sm text-muted-foreground">Loading executive overview…</p>}>
      <KpiDashboardContainer />
    </Suspense>
  )
}
