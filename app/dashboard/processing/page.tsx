import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ProcessingReportsTable } from "@/components/operations/processing-reports-table"
import { Plus, Filter } from "lucide-react"
import Link from "next/link"

export default async function ProcessingPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const { data: profile } = await supabase.from("profiles").select("role, department").eq("id", user.id).single()

  const canViewAll = profile?.role === "md" || profile?.role === "admin"

  let reportsQuery = supabase
    .from("processing_reports")
    .select("*, created_by(full_name)")
    .order("report_date", { ascending: false })

  if (!canViewAll) {
    reportsQuery = reportsQuery.eq("department", profile?.department)
  }

  const { data: reports } = await reportsQuery

  const totalBatches = reports?.length || 0
  const totalProcessed = reports?.reduce((sum, r) => sum + Number(r.processed_quantity || 0), 0) || 0
  const totalWaste = reports?.reduce((sum, r) => sum + Number(r.waste_quantity || 0), 0) || 0
  const avgEfficiency =
    reports && reports.length > 0
      ? (reports.reduce((sum, r) => sum + Number(r.efficiency_percentage || 0), 0) / reports.length).toFixed(1)
      : "0"

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Processing Reports</h1>
          <p className="text-muted-foreground">Monitor seed processing and efficiency metrics</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="icon">
            <Filter className="h-4 w-4" />
          </Button>
          <Button asChild>
            <Link href="/dashboard/processing/new">
              <Plus className="mr-2 h-4 w-4" />
              New Report
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Batches</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalBatches}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Processed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalProcessed.toLocaleString()} kg</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Waste</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalWaste.toLocaleString()} kg</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Avg Efficiency</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgEfficiency}%</div>
          </CardContent>
        </Card>
      </div>

      <ProcessingReportsTable reports={reports || []} />
    </div>
  )
}
