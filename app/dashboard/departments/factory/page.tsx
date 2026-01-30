import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Package, Truck, Factory, Cog, Plus, Filter } from "lucide-react"
import Link from "next/link"
import { canViewConfidentialReports } from "@/lib/utils/permissions"
import { FactoryActivityForm } from "@/components/factory/factory-activity-form"
import { FactoryMetricsChart } from "@/components/factory/factory-metrics-chart"

// Manufacturing (Factory) - Special Case with Operational Dashboard
// Manufacturing is the ONLY department that lands on an operational dashboard first
// This is intentional due to real-time seed production monitoring requirements
export default async function FactoryDashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

  // Allow Factory staff and MD to view this page
  const isFactoryStaff = profile?.department === "OPERATIONS" && profile?.sub_department === "FACTORY"
  const isMD = profile?.role && canViewConfidentialReports(profile.role)
  
  if (!profile || (!isFactoryStaff && !isMD)) {
    redirect("/dashboard")
  }

  // Fetch factory activity data aggregated by variety
  const { data: activities } = await supabase
    .from("factory_activities")
    .select("*")
    .order("created_at", { ascending: false })

  // Calculate tonnage metrics
  const rawSeedReceived = activities?.filter(a => a.activity_type === "raw_seed_received")
    .reduce((sum, a) => sum + (a.quantity_tonnes || 0), 0) || 0
  
  const seedProcessed = activities?.filter(a => a.activity_type === "seed_processed")
    .reduce((sum, a) => sum + (a.quantity_tonnes || 0), 0) || 0
  
  const seedPackaged = activities?.filter(a => a.activity_type === "seed_packaged")
    .reduce((sum, a) => sum + (a.quantity_tonnes || 0), 0) || 0
  
  const seedDispatched = activities?.filter(a => a.activity_type === "seed_dispatched")
    .reduce((sum, a) => sum + (a.quantity_tonnes || 0), 0) || 0

  // Group by variety
  const byVariety = activities?.reduce((acc, activity) => {
    const key = `${activity.seed_category}-${activity.seed_variety}`
    if (!acc[key]) {
      acc[key] = { category: activity.seed_category, variety: activity.seed_variety, raw: 0, processed: 0, packaged: 0, dispatched: 0 }
    }
    if (activity.activity_type === "raw_seed_received") acc[key].raw += activity.quantity_tonnes || 0
    if (activity.activity_type === "seed_processed") acc[key].processed += activity.quantity_tonnes || 0
    if (activity.activity_type === "seed_packaged") acc[key].packaged += activity.quantity_tonnes || 0
    if (activity.activity_type === "seed_dispatched") acc[key].dispatched += activity.quantity_tonnes || 0
    return acc
  }, {} as Record<string, any>) || {}

  // Recent activities for the log
  const recentActivities = activities?.slice(0, 10) || []

  const metrics = [
    {
      title: "Raw Seed Received",
      value: `${rawSeedReceived.toFixed(2)} MT`,
      description: "Total raw seed intake",
      icon: Package,
      color: "text-amber-600",
    },
    {
      title: "Seed Processed",
      value: `${seedProcessed.toFixed(2)} MT`,
      description: "Total processed seed",
      icon: Cog,
      color: "text-blue-600",
    },
    {
      title: "Seed Packaged",
      value: `${seedPackaged.toFixed(2)} MT`,
      description: "Total packaged seed",
      icon: Factory,
      color: "text-green-600",
    },
    {
      title: "Seed Dispatched",
      value: `${seedDispatched.toFixed(2)} MT`,
      description: "Total dispatched seed",
      icon: Truck,
      color: "text-purple-600",
    },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Factory className="h-8 w-8 text-primary" />
            Factory Dashboard
          </h1>
          <p className="text-muted-foreground">
            Real-time seed production monitoring and activity tracking
          </p>
          {isMD && !isFactoryStaff && (
            <Badge variant="outline" className="mt-2">Read-Only Access (MD)</Badge>
          )}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="icon">
            <Filter className="h-4 w-4" />
          </Button>
          {isFactoryStaff && (
            <Button asChild>
              <Link href="/dashboard/departments/factory/activity/new">
                <Plus className="mr-2 h-4 w-4" />
                Log Activity
              </Link>
            </Button>
          )}
        </div>
      </div>

      {/* Core Metrics (Tonnage-Based) */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {metrics.map((metric) => {
          const Icon = metric.icon
          return (
            <Card key={metric.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{metric.title}</CardTitle>
                <Icon className={`h-4 w-4 ${metric.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metric.value}</div>
                <p className="text-xs text-muted-foreground">{metric.description}</p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Tabs for different views */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="by-variety">By Variety</TabsTrigger>
          <TabsTrigger value="activity-log">Activity Log</TabsTrigger>
          {isFactoryStaff && <TabsTrigger value="log-activity">Log Activity</TabsTrigger>}
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Production Flow</CardTitle>
                <CardDescription>Seed processing pipeline metrics</CardDescription>
              </CardHeader>
              <CardContent>
                <FactoryMetricsChart 
                  rawSeed={rawSeedReceived}
                  processed={seedProcessed}
                  packaged={seedPackaged}
                  dispatched={seedDispatched}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Quick Stats</CardTitle>
                <CardDescription>Processing efficiency indicators</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Processing Rate</span>
                  <span className="font-medium">
                    {rawSeedReceived > 0 ? ((seedProcessed / rawSeedReceived) * 100).toFixed(1) : 0}%
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Packaging Rate</span>
                  <span className="font-medium">
                    {seedProcessed > 0 ? ((seedPackaged / seedProcessed) * 100).toFixed(1) : 0}%
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Dispatch Rate</span>
                  <span className="font-medium">
                    {seedPackaged > 0 ? ((seedDispatched / seedPackaged) * 100).toFixed(1) : 0}%
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">In Stock</span>
                  <span className="font-medium">
                    {(seedPackaged - seedDispatched).toFixed(2)} MT
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="by-variety" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Metrics by Seed Variety</CardTitle>
              <CardDescription>Tonnage breakdown by seed category and variety</CardDescription>
            </CardHeader>
            <CardContent>
              {Object.keys(byVariety).length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No activity data recorded yet. Start by logging factory activities.
                </p>
              ) : (
                <div className="space-y-4">
                  {Object.entries(byVariety).map(([key, data]: [string, any]) => (
                    <div key={key} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h4 className="font-medium">{data.variety}</h4>
                          <p className="text-xs text-muted-foreground">{data.category}</p>
                        </div>
                        <Badge variant="outline">{(data.raw + data.processed + data.packaged + data.dispatched).toFixed(2)} MT Total</Badge>
                      </div>
                      <div className="grid grid-cols-4 gap-2 text-sm">
                        <div className="text-center p-2 bg-amber-50 rounded">
                          <p className="text-amber-600 font-medium">{data.raw.toFixed(2)}</p>
                          <p className="text-xs text-muted-foreground">Raw</p>
                        </div>
                        <div className="text-center p-2 bg-blue-50 rounded">
                          <p className="text-blue-600 font-medium">{data.processed.toFixed(2)}</p>
                          <p className="text-xs text-muted-foreground">Processed</p>
                        </div>
                        <div className="text-center p-2 bg-green-50 rounded">
                          <p className="text-green-600 font-medium">{data.packaged.toFixed(2)}</p>
                          <p className="text-xs text-muted-foreground">Packaged</p>
                        </div>
                        <div className="text-center p-2 bg-purple-50 rounded">
                          <p className="text-purple-600 font-medium">{data.dispatched.toFixed(2)}</p>
                          <p className="text-xs text-muted-foreground">Dispatched</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity-log" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity Log</CardTitle>
              <CardDescription>Immutable record of all factory activities</CardDescription>
            </CardHeader>
            <CardContent>
              {recentActivities.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No activities logged yet.
                </p>
              ) : (
                <div className="space-y-3">
                  {recentActivities.map((activity) => (
                    <div key={activity.id} className="flex items-center justify-between border-b pb-3 last:border-0">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="capitalize">
                            {activity.activity_type.replace(/_/g, " ")}
                          </Badge>
                          <span className="font-medium">{activity.seed_variety}</span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {activity.quantity_tonnes} MT
                          {activity.packaging_size && ` - ${activity.packaging_size}`}
                          {activity.notes && ` - ${activity.notes}`}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(activity.activity_date).toLocaleDateString()} at {new Date(activity.created_at).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {isFactoryStaff && (
          <TabsContent value="log-activity" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Log Daily Activity</CardTitle>
                <CardDescription>Record factory activities - entries are immutable once submitted</CardDescription>
              </CardHeader>
              <CardContent>
                <FactoryActivityForm />
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  )
}
