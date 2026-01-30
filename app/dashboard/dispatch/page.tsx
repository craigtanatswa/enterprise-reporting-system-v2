import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { DispatchReportsTable } from "@/components/operations/dispatch-reports-table"
import { Plus, Filter } from "lucide-react"
import Link from "next/link"

export default async function DispatchPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const { data: profile } = await supabase.from("profiles").select("role, department").eq("id", user.id).single()

  const canViewAll = profile?.role === "md" || profile?.role === "admin" || profile?.role === "accountant"

  let reportsQuery = supabase
    .from("dispatch_reports")
    .select("*, created_by(full_name)")
    .order("dispatch_date", { ascending: false })

  if (!canViewAll) {
    reportsQuery = reportsQuery.eq("department", profile?.department)
  }

  const { data: reports } = await reportsQuery

  const totalDispatches = reports?.length || 0
  const totalQuantity = reports?.reduce((sum, r) => sum + Number(r.quantity || 0), 0) || 0
  const uniqueCustomers = new Set(reports?.map((r) => r.customer_name)).size
  const uniqueVehicles = new Set(reports?.map((r) => r.vehicle_number)).size

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dispatch Reports</h1>
          <p className="text-muted-foreground">Track vehicle dispatches and deliveries</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="icon">
            <Filter className="h-4 w-4" />
          </Button>
          <Button asChild>
            <Link href="/dashboard/dispatch/new">
              <Plus className="mr-2 h-4 w-4" />
              New Dispatch
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Dispatches</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalDispatches}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Quantity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalQuantity.toLocaleString()} kg</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Unique Customers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{uniqueCustomers}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Vehicles Used</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{uniqueVehicles}</div>
          </CardContent>
        </Card>
      </div>

      <DispatchReportsTable reports={reports || []} />
    </div>
  )
}
