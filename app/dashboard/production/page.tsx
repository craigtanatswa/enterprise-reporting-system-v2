import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ProductionReportsTable } from "@/components/operations/production-reports-table"
import { Plus, Filter } from "lucide-react"
import Link from "next/link"

export default async function ProductionPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const { data: profile } = await supabase.from("profiles").select("role, department").eq("id", user.id).single()

  const canViewAll = profile?.role === "md" || profile?.role === "admin"

  // Fetch production reports
  let reportsQuery = supabase
    .from("production_reports")
    .select("*, created_by(full_name)")
    .order("report_date", { ascending: false })

  if (!canViewAll) {
    reportsQuery = reportsQuery.eq("department", profile?.department)
  }

  const { data: reports } = await reportsQuery

  // Group by status
  const plannedReports = reports?.filter((r) => r.status === "planned") || []
  const inProgressReports = reports?.filter((r) => r.status === "in_progress") || []
  const completedReports = reports?.filter((r) => r.status === "completed") || []
  const delayedReports = reports?.filter((r) => r.status === "delayed") || []

  // Calculate totals
  const totalTarget = reports?.reduce((sum, r) => sum + Number(r.target_quantity || 0), 0) || 0
  const totalActual = reports?.reduce((sum, r) => sum + Number(r.actual_quantity || 0), 0) || 0
  const achievement = totalTarget > 0 ? ((totalActual / totalTarget) * 100).toFixed(1) : "0"

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Production Reports</h1>
          <p className="text-muted-foreground">Track and manage daily production across all shifts</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="icon">
            <Filter className="h-4 w-4" />
          </Button>
          <Button asChild>
            <Link href="/dashboard/production/new">
              <Plus className="mr-2 h-4 w-4" />
              New Report
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Reports</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reports?.length || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Target Production</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalTarget.toLocaleString()} kg</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Actual Production</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalActual.toLocaleString()} kg</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Achievement</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{achievement}%</div>
          </CardContent>
        </Card>
      </div>

      {/* Reports Tabs */}
      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">All Reports</TabsTrigger>
          <TabsTrigger value="planned">Planned</TabsTrigger>
          <TabsTrigger value="in_progress">In Progress</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
          <TabsTrigger value="delayed">Delayed</TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          <ProductionReportsTable reports={reports || []} />
        </TabsContent>

        <TabsContent value="planned">
          <ProductionReportsTable reports={plannedReports} />
        </TabsContent>

        <TabsContent value="in_progress">
          <ProductionReportsTable reports={inProgressReports} />
        </TabsContent>

        <TabsContent value="completed">
          <ProductionReportsTable reports={completedReports} />
        </TabsContent>

        <TabsContent value="delayed">
          <ProductionReportsTable reports={delayedReports} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
