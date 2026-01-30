import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { DepartmentArchivePage } from "@/components/documents/department-archive-page"

export default async function PropertiesArchivePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

  if (!profile || profile.department !== "PROPERTIES_MANAGEMENT") {
    redirect("/dashboard")
  }

  return (
    <DepartmentArchivePage
      department="PROPERTIES_MANAGEMENT"
      departmentLabel="Properties & Administration"
      basePath="/dashboard/departments/properties"
    />
  )
}
