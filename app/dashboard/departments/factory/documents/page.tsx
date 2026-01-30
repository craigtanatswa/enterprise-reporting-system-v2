import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { DepartmentDocumentsPage } from "@/components/documents/department-documents-page"

export default async function FactoryDocumentsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

  if (!profile || profile.department !== "OPERATIONS" || profile.sub_department !== "FACTORY") {
    redirect("/dashboard")
  }

  return (
    <DepartmentDocumentsPage
      department="OPERATIONS"
      departmentLabel="Factory"
      basePath="/dashboard/departments/factory"
    />
  )
}
