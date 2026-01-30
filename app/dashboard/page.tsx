import { Badge } from "@/components/ui/badge"
import { CardDescription } from "@/components/ui/card"
import { CardContent } from "@/components/ui/card"
import { CardTitle } from "@/components/ui/card"
import { CardHeader } from "@/components/ui/card"
import { Card } from "@/components/ui/card"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { getDepartmentDashboardUrl } from "@/lib/utils/dashboard-routing"
import { Factory, Truck, AlertCircle, Users, CheckCircle2, FileText, Cog } from "lucide-react"
import { getRoleLabel, getDepartmentLabel } from "@/lib/utils/labels"

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

  // Redirect users to their department-specific dashboard
  if (profile) {
    const departmentUrl = getDepartmentDashboardUrl(profile.department, profile.sub_department)
    redirect(departmentUrl)
  }

  // Fallback if no profile
  redirect("/auth/login")
}

// Fetch stats data
const { data: statsData } = await createClient().rpc("get_user_dashboard_stats", {
  p_user_id: user.id,
})

const stats = statsData || {}

const isAdmin = profile?.role === "md" || profile?.role === "admin"

// Fetch recent production reports
const { data: recentProduction } = await createClient().from("production_reports")
  .select("*, created_by(full_name)")
  .order("created_at", { ascending: false })
  .limit(5)

// Fetch recent pending approvals
const { data: recentApprovals } = await createClient().from("pending_approvals").select("*").limit(5)
