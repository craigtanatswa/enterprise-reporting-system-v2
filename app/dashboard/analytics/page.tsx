import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ProductionChart } from "@/components/analytics/production-chart"
import { DispatchChart } from "@/components/analytics/dispatch-chart"
import { DepartmentPerformance } from "@/components/analytics/department-performance"
import { PendingApprovalsTable } from "@/components/analytics/pending-approvals-table"
import { TrendingUp, TrendingDown, Factory, Truck, CheckCircle2 } from "lucide-react"

export default async function AnalyticsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const { data: profile } = await supabase.from("profiles").select("role, department").eq("id", user.id).single()

  // Check if user has analytics access (MD, Admin, Factory Manager, Accountant)
  if (!profile || profile.role === "data_entry") {
    redirect("/dashboard")
  }

  const isGlobalAccess = profile.role === "md" || profile.role === "admin"

  // Fetch production summary
  const { data: productionSummary } = await supabase
    .from("daily_production_summary")
    .select("*")
    .order("report_date", { ascending: false })
    .limit(30)

  // Fetch dispatch summary
  const { data: dispatchSummary } = await supabase
    .from("monthly_dispatch_summary")
    .select("*")
    .order("month", { ascending: false })
    .limit(12)

  // Fetch department performance
  const { data: departmentPerformance } = await supabase.from("department_performance").select("*")

  // Fetch pending approvals
  const { data: pendingApprovals } = await supabase.from("pending_approvals").select("*").limit(10)

  // Calculate aggregate stats
  const totalProduction = productionSummary?.reduce((sum, item) => sum + Number(item.total_actual || 0), 0) || 0
  const totalTarget = productionSummary?.reduce((sum, item) => sum + Number(item.total_target || 0), 0) || 0
  const avgAchievement = totalTarget > 0 ? ((totalProduction / totalTarget) * 100).toFixed(1) : "0"

  const totalDispatches = dispatchSummary?.reduce((sum, item) => sum + Number(item.total_dispatches || 0), 0) || 0
  const totalDispatchQuantity = dispatchSummary?.reduce((sum, item) => sum + Number(item.total_quantity || 0), 0) || 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Analytics Dashboard</h1>
        <p className="text-muted-foreground">
          {isGlobalAccess ? "Comprehensive analytics across all departments" : "Department-specific analytics"}
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Production Achievement</CardTitle>
            <Factory className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgAchievement}%</div>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              {Number(avgAchievement) >= 100 ? (
                <>
                  <TrendingUp className="h-3 w-3 text-green-500" />
                  <span className="text-green-500">On target</span>
                </>
              ) : (
                <>
                  <TrendingDown className="h-3 w-3 text-destructive" />
                  <span className="text-destructive">Below target</span>
                </>
              )}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Production</CardTitle>
            <Factory className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalProduction.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">kg produced (last 30 days)</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Dispatches</CardTitle>
            <Truck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalDispatches}</div>
            <p className="text-xs text-muted-foreground">{totalDispatchQuantity.toLocaleString()} kg shipped</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pending Approvals</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingApprovals?.length || 0}</div>
            <p className="text-xs text-muted-foreground">Require attention</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <Tabs defaultValue="production" className="space-y-4">
        <TabsList>
          <TabsTrigger value="production">Production Trends</TabsTrigger>
          <TabsTrigger value="dispatch">Dispatch Analysis</TabsTrigger>
          <TabsTrigger value="departments">Department Performance</TabsTrigger>
          <TabsTrigger value="approvals">Pending Approvals</TabsTrigger>
        </TabsList>

        <TabsContent value="production" className="space-y-4">
          <ProductionChart data={productionSummary || []} />
        </TabsContent>

        <TabsContent value="dispatch" className="space-y-4">
          <DispatchChart data={dispatchSummary || []} />
        </TabsContent>

        <TabsContent value="departments" className="space-y-4">
          <DepartmentPerformance data={departmentPerformance || []} />
        </TabsContent>

        <TabsContent value="approvals" className="space-y-4">
          <PendingApprovalsTable data={pendingApprovals || []} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
