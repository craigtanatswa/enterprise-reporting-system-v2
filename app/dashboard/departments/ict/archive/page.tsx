import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { DepartmentArchivePage } from "@/components/documents/department-archive-page"

export default async function ICTArchivePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

  if (!profile || profile.department !== "ICT_AND_DIGITAL_TRANSFORMATION") {
    redirect("/dashboard")
  }

  return (
    <DepartmentArchivePage
      department="ICT_AND_DIGITAL_TRANSFORMATION"
      departmentLabel="ICT & Digital Transformation"
      basePath="/dashboard/departments/ict"
    />
  )
}
