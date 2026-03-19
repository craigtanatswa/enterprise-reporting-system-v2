import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { SupervisorReportsPage } from "@/components/documents/supervisor-reports-page"
import { GM_DEPARTMENT } from "@/lib/utils/reporting-structure"
import { isGeneralManager } from "@/lib/utils/permissions"

export default async function GMDashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()

  if (!profile || (!isGeneralManager(profile.role) && profile.role !== "BOOTSTRAP_ADMIN")) {
    redirect("/dashboard")
  }

  return (
    <SupervisorReportsPage
      title="General Manager Dashboard"
      description="Reports from Operations (Manufacturing and Agronomy)"
      departmentFilter={[GM_DEPARTMENT]}
    />
  )
}
