import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { DepartmentDocumentsPage } from "@/components/documents/department-documents-page"

export default async function MarketingDocumentsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

  if (!profile || profile.department !== "MARKETING_AND_SALES") {
    redirect("/dashboard")
  }

  return (
    <DepartmentDocumentsPage
      department="MARKETING_AND_SALES"
      departmentLabel="Marketing & Sales"
      basePath="/dashboard/departments/marketing"
    />
  )
}
