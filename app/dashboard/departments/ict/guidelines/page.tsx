import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { DepartmentGuidelinesPage } from "@/components/documents/department-guidelines-page"

export default async function ICTGuidelinesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

  if (!profile || profile.department !== "ICT_AND_DIGITAL_TRANSFORMATION") {
    redirect("/dashboard")
  }

  return <DepartmentGuidelinesPage departmentLabel="ICT & Digital Transformation" />
}
