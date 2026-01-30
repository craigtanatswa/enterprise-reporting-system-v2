import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { MinimalDepartmentDashboard } from "@/components/documents/minimal-department-dashboard"

export default async function PublicRelationsDashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

  if (!profile || profile.department !== "PUBLIC_RELATIONS") {
    redirect("/dashboard")
  }

  return (
    <MinimalDepartmentDashboard
      department="PUBLIC_RELATIONS"
      departmentLabel="Public Relations"
      basePath="/dashboard/departments/public-relations"
    />
  )
}
