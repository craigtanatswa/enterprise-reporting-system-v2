"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Package, Truck, Factory, Cog, Plus, Filter } from "lucide-react"
import { supabase } from "@/lib/supabase/client"
import { FactoryActivityForm } from "@/components/factory/factory-activity-form"
import { FactoryMetricsChart } from "@/components/factory/factory-metrics-chart"

export type FactoryActivityRow = {
  id: string
  activity_type: string
  seed_category: string
  seed_variety: string
  quantity_tonnes: number | null
  packaging_size: string | null
  notes: string | null
  activity_date: string
  created_at: string
}

type FactoryOperationalSectionProps = {
  /** When set (including empty array), skips client fetch on mount. Omit to load via Supabase client. */
  initialActivities?: FactoryActivityRow[] | null
  showFactoryStaffUi: boolean
  /** MD / bootstrap-style read-only access (e.g. not factory staff). */
  observerMode?: boolean
}

export function FactoryOperationalSection({
  initialActivities,
  showFactoryStaffUi,
  observerMode,
}: FactoryOperationalSectionProps) {
  const [activities, setActivities] = useState<FactoryActivityRow[] | null>(
    initialActivities !== undefined ? initialActivities : null
  )
  const [loading, setLoading] = useState(initialActivities === undefined)

  const load = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from("factory_activities")
      .select("*")
      .order("created_at", { ascending: false })
    if (!error && data) {
      setActivities(data as FactoryActivityRow[])
    } else {
      setActivities([])
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    if (initialActivities !== undefined) {
      setActivities(initialActivities)
      setLoading(false)
      return
    }
    load()
  }, [initialActivities, load])

  const rows = activities ?? []

  const rawSeedReceived = useMemo(
    () =>
      rows.filter((a) => a.activity_type === "raw_seed_received").reduce((sum, a) => sum + (a.quantity_tonnes || 0), 0),
    [rows]
  )
  const seedProcessed = useMemo(
    () => rows.filter((a) => a.activity_type === "seed_processed").reduce((sum, a) => sum + (a.quantity_tonnes || 0), 0),
    [rows]
  )
  const seedPackaged = useMemo(
    () => rows.filter((a) => a.activity_type === "seed_packaged").reduce((sum, a) => sum + (a.quantity_tonnes || 0), 0),
    [rows]
  )
  const seedDispatched = useMemo(
    () => rows.filter((a) => a.activity_type === "seed_dispatched").reduce((sum, a) => sum + (a.quantity_tonnes || 0), 0),
    [rows]
  )

  const byVariety = useMemo(() => {
    return rows.reduce((acc, activity) => {
      const key = `${activity.seed_category}-${activity.seed_variety}`
      if (!acc[key]) {
        acc[key] = {
          category: activity.seed_category,
          variety: activity.seed_variety,
          raw: 0,
          processed: 0,
          packaged: 0,
          dispatched: 0,
        }
      }
      if (activity.activity_type === "raw_seed_received") acc[key].raw += activity.quantity_tonnes || 0
      if (activity.activity_type === "seed_processed") acc[key].processed += activity.quantity_tonnes || 0
      if (activity.activity_type === "seed_packaged") acc[key].packaged += activity.quantity_tonnes || 0
      if (activity.activity_type === "seed_dispatched") acc[key].dispatched += activity.quantity_tonnes || 0
      return acc
    }, {} as Record<string, { category: string; variety: string; raw: number; processed: number; packaged: number; dispatched: number }>)
  }, [rows])

  const recentActivities = rows.slice(0, 10)

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

  if (loading) {
    return (
      <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
        Loading factory operations…
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold tracking-tight flex items-center gap-2">
            <Factory className="h-6 w-6 text-primary" />
            Factory operations
          </h2>
          <p className="text-sm text-muted-foreground">Live seed production tonnage and activity</p>
          {observerMode && (
            <Badge variant="outline" className="mt-2">
              Read-only access
            </Badge>
          )}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="icon" type="button">
            <Filter className="h-4 w-4" />
          </Button>
          {showFactoryStaffUi && (
            <Button asChild>
              <Link href="/dashboard/departments/factory/activity/new">
                <Plus className="mr-2 h-4 w-4" />
                Log Activity
              </Link>
            </Button>
          )}
        </div>
      </div>

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

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="by-variety">By Variety</TabsTrigger>
          <TabsTrigger value="activity-log">Activity Log</TabsTrigger>
          {showFactoryStaffUi && <TabsTrigger value="log-activity">Log Activity</TabsTrigger>}
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
                  <span className="font-medium">{(seedPackaged - seedDispatched).toFixed(2)} MT</span>
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
                  {Object.entries(byVariety).map(([key, data]) => (
                    <div key={key} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h4 className="font-medium">{data.variety}</h4>
                          <p className="text-xs text-muted-foreground">{data.category}</p>
                        </div>
                        <Badge variant="outline">
                          {(data.raw + data.processed + data.packaged + data.dispatched).toFixed(2)} MT Total
                        </Badge>
                      </div>
                      <div className="grid grid-cols-4 gap-2 text-sm">
                        <div className="text-center p-2 bg-amber-50 rounded dark:bg-amber-950/30">
                          <p className="text-amber-600 font-medium dark:text-amber-400">{data.raw.toFixed(2)}</p>
                          <p className="text-xs text-muted-foreground">Raw</p>
                        </div>
                        <div className="text-center p-2 bg-blue-50 rounded dark:bg-blue-950/30">
                          <p className="text-blue-600 font-medium dark:text-blue-400">{data.processed.toFixed(2)}</p>
                          <p className="text-xs text-muted-foreground">Processed</p>
                        </div>
                        <div className="text-center p-2 bg-green-50 rounded dark:bg-green-950/30">
                          <p className="text-green-600 font-medium dark:text-green-400">{data.packaged.toFixed(2)}</p>
                          <p className="text-xs text-muted-foreground">Packaged</p>
                        </div>
                        <div className="text-center p-2 bg-purple-50 rounded dark:bg-purple-950/30">
                          <p className="text-purple-600 font-medium dark:text-purple-400">{data.dispatched.toFixed(2)}</p>
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
                <p className="text-sm text-muted-foreground text-center py-8">No activities logged yet.</p>
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
                          {new Date(activity.activity_date).toLocaleDateString()} at{" "}
                          {new Date(activity.created_at).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {showFactoryStaffUi && (
          <TabsContent value="log-activity" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Log Daily Activity</CardTitle>
                <CardDescription>Record factory activities — entries are immutable once submitted</CardDescription>
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
