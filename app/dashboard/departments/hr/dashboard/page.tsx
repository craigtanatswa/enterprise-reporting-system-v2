import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

export default async function HrDashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

  if (!profile || profile.department !== "HUMAN_RESOURCES_AND_ADMINISTRATION") {
    redirect("/dashboard")
  }

  redirect("/dashboard/kpi")
}
