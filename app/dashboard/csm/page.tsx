import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { SupervisorReportsPage } from "@/components/documents/supervisor-reports-page"
import { CSM_DEPARTMENTS } from "@/lib/utils/reporting-structure"
import { isCorporateServicesManager } from "@/lib/utils/permissions"

export default async function CSMDashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()

  if (!profile || (!isCorporateServicesManager(profile.role) && profile.role !== "BOOTSTRAP_ADMIN")) {
    redirect("/dashboard")
  }

  return (
    <SupervisorReportsPage
      title="Corporate Services Manager Dashboard"
      description="Reports from Marketing, Legal, HR, Properties, and ICT"
      departmentFilter={CSM_DEPARTMENTS}
    />
  )
}
