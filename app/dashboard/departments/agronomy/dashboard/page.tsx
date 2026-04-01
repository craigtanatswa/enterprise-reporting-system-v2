import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

export default async function AgronomyDashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

  if (!profile || profile.department !== "OPERATIONS" || profile.sub_department !== "AGRONOMY") {
    redirect("/dashboard")
  }

  redirect("/dashboard/kpi")
}
