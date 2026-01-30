import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

export default async function PublicRelationsDashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

  if (!profile || profile.department !== "PUBLIC_RELATIONS") {
    redirect("/dashboard")
  }

  // Redirect to documents page as primary entry point
  redirect("/dashboard/departments/public-relations/documents")
}
