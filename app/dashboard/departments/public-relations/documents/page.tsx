import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { DepartmentDocumentsPage } from "@/components/documents/department-documents-page"

export default async function PublicRelationsDocumentsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

  if (!profile || profile.department !== "PUBLIC_RELATIONS") {
    redirect("/dashboard")
  }

  return (
    <DepartmentDocumentsPage
      department="PUBLIC_RELATIONS"
      departmentLabel="Public Relations"
      basePath="/dashboard/departments/public-relations"
    />
  )
}
