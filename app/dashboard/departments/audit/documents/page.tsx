import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { DepartmentDocumentsPage } from "@/components/documents/department-documents-page"

export default async function AuditDocumentsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

  if (!profile || profile.department !== "AUDIT") {
    redirect("/dashboard")
  }

  return (
    <DepartmentDocumentsPage
      department="AUDIT"
      departmentLabel="Audit"
      basePath="/dashboard/departments/audit"
    />
  )
}
