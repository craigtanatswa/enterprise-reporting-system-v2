import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

export default async function LegalDashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

  if (!profile || profile.department !== "LEGAL_AND_COMPLIANCE") {
    redirect("/dashboard")
  }

  // Redirect to documents page as primary entry point
  redirect("/dashboard/departments/legal/documents")
}
