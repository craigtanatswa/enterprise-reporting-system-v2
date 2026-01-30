import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { MinimalDepartmentDashboard } from "@/components/documents/minimal-department-dashboard"

export default async function LegalDashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

  if (!profile || profile.department !== "LEGAL_AND_COMPLIANCE") {
    redirect("/dashboard")
  }

  return (
    <MinimalDepartmentDashboard
      department="LEGAL_AND_COMPLIANCE"
      departmentLabel="Legal & Compliance"
      basePath="/dashboard/departments/legal"
    />
  )
}
