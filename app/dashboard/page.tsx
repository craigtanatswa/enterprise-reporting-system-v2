import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { getDepartmentDashboardUrl } from "@/lib/utils/dashboard-routing"

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

  // Redirect users to their department-specific dashboard
  if (profile) {
    const departmentUrl = getDepartmentDashboardUrl(profile.department, profile.sub_department)
    redirect(departmentUrl)
  }

  // Fallback if no profile
  redirect("/auth/login")
}
