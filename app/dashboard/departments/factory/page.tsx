import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { canViewConfidentialReports } from "@/lib/utils/permissions"
import { FactoryOperationalSection, type FactoryActivityRow } from "@/components/factory/factory-operational-section"

// Manufacturing (Factory) — operational console; MD / confidential viewers use KPI Manufacturing (merged view).
export default async function FactoryDashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

  const isFactoryStaff = profile?.department === "OPERATIONS" && profile?.sub_department === "FACTORY"
  const observerViaConfidential =
    profile?.role && canViewConfidentialReports(profile.role) && !isFactoryStaff

  if (!profile || (!isFactoryStaff && !observerViaConfidential)) {
    redirect("/dashboard")
  }

  if (observerViaConfidential) {
    redirect("/dashboard/kpi?dept=operations-manufacturing")
  }

  const { data: activities } = await supabase
    .from("factory_activities")
    .select("*")
    .order("created_at", { ascending: false })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Factory Dashboard</h1>
        <p className="text-muted-foreground">Real-time seed production monitoring and activity tracking</p>
      </div>
      <FactoryOperationalSection
        initialActivities={(activities ?? []) as FactoryActivityRow[]}
        showFactoryStaffUi
        observerMode={false}
      />
    </div>
  )
}
