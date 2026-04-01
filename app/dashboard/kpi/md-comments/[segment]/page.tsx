import { KpiMdCommentsView } from "@/components/kpi-dashboard/kpi-md-comments-view"
import { createClient } from "@/lib/supabase/server"
import { userMayAccessSegment } from "@/lib/kpi-dashboard/segment-map"
import type { Department, SubDepartment } from "@/lib/utils/permissions"
import type { UserRole } from "@/lib/utils/permissions"
import { redirect } from "next/navigation"

export default async function KpiMdCommentsPage({
  params,
}: {
  params: Promise<{ segment: string }>
}) {
  const { segment } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/auth/login")

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()
  if (!profile?.is_active) redirect("/auth/verify-email?error=pending-approval")

  const role = profile.role as UserRole
  const dept = profile.department as Department
  const sub = profile.sub_department as SubDepartment | null
  if (!userMayAccessSegment(role, dept, sub, segment)) {
    redirect("/dashboard")
  }

  return <KpiMdCommentsView segmentId={segment} />
}
