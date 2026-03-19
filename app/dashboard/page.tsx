import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { getDepartmentDashboardUrl } from "@/lib/utils/dashboard-routing"
import { isAdmin } from "@/lib/utils/permissions"

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

  if (profile) {
    // Administrators land on admin dashboard
    if (isAdmin(profile.role)) {
      redirect("/dashboard/admin")
    }
    // Redirect other users to their department-specific dashboard
    const departmentUrl = getDepartmentDashboardUrl(
      profile.department,
      profile.sub_department,
      profile.role
    )
    redirect(departmentUrl)
  }

  // Fallback if no profile
  redirect("/auth/login")
}
