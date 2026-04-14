"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { ArrowLeft, Save, MessageSquare } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type { MetricStatus, MetricData } from "@/lib/kpi-dashboard/types"
import { useKpiDashboard } from "@/components/kpi-dashboard/kpi-dashboard-provider"
import { addKpiDepartmentCommentAction, updateKpiMetricAction } from "@/app/actions/kpi-dashboard"

const statusColors: Record<MetricStatus, string> = {
  green: "bg-[oklch(0.6_0.15_145)] text-white",
  amber: "bg-[oklch(0.75_0.12_85)] text-[oklch(0.25_0.02_85)]",
  red: "bg-[oklch(0.6_0.2_25)] text-white",
}

interface MetricFormData {
  value: string
  status: MetricStatus
  trend: "up" | "down" | "stable"
  details: string
  comment: string
}

export function KpiDataEntry({ segmentId }: { segmentId: string }) {
  const router = useRouter()
  const { getDepartment, canEditDepartmentMetrics, refresh } = useKpiDashboard()
  const [formData, setFormData] = useState<Record<string, MetricFormData>>({})
  const [saving, setSaving] = useState(false)

  const department = getDepartment(segmentId)

  if (!department) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <p className="text-muted-foreground">Department not found</p>
        <Button variant="outline" className="mt-4" onClick={() => router.push("/dashboard/kpi")}>
          Back
        </Button>
      </div>
    )
  }

  if (!canEditDepartmentMetrics) {
    return (
      <div className="py-16 text-center text-muted-foreground">
        You do not have permission to update metrics for this department.
      </div>
    )
  }

  const initForm = (metric: MetricData): MetricFormData =>
    formData[metric.id] || {
      value: String(metric.value),
      status: metric.status || "green",
      trend: metric.trend || "stable",
      details: metric.details || "",
      comment: "",
    }

  const patchForm = (metricId: string, updates: Partial<MetricFormData>) => {
    const metric = department.metrics.find((m) => m.id === metricId)
    if (!metric) return
    setFormData((prev) => ({
      ...prev,
      [metricId]: { ...initForm(metric), ...prev[metricId], ...updates },
    }))
  }

  const usesMonthlyBreakdown = (id: string) =>
    id === "sales-revenue" ||
    id === "sales-volume-variety" ||
    id === "fin-inventory-levels"

  const saveMetric = async (metricId: string) => {
    const metric = department.metrics.find((m) => m.id === metricId)
    if (!metric) return
    const data = formData[metricId] ?? initForm(metric)
    const skipHeadlineFields = usesMonthlyBreakdown(metricId)
    setSaving(true)
    await updateKpiMetricAction({
      segmentId,
      metricId,
      value: skipHeadlineFields ? String(metric.value) : data.value,
      status: data.status,
      trend: data.trend,
      details: skipHeadlineFields ? (metric.details ?? "") : data.details,
    })
    if (data.comment.trim()) {
      await addKpiDepartmentCommentAction({
        segmentId,
        metricId,
        body: data.comment.trim(),
      })
      patchForm(metricId, { comment: "" })
    }
    setSaving(false)
    refresh()
  }

  const saveAll = async () => {
    setSaving(true)
    for (const m of department.metrics) {
      const data = formData[m.id] ?? {
        value: String(m.value),
        status: (m.status || "green") as MetricStatus,
        trend: m.trend || "stable",
        details: m.details || "",
        comment: "",
      }
      const skipHeadlineFields = usesMonthlyBreakdown(m.id)
      await updateKpiMetricAction({
        segmentId,
        metricId: m.id,
        value: skipHeadlineFields ? String(m.value) : data.value,
        status: data.status,
        trend: data.trend,
        details: skipHeadlineFields ? (m.details ?? "") : data.details,
      })
      if (data.comment.trim()) {
        await addKpiDepartmentCommentAction({
          segmentId,
          metricId: m.id,
          body: data.comment.trim(),
        })
      }
    }
    setFormData({})
    setSaving(false)
    refresh()
    router.push("/dashboard/kpi")
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push("/dashboard/kpi")}>
            <ArrowLeft className="size-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Update metrics — {department.name}</h1>
            <p className="text-muted-foreground">Values are saved to the database and roll up to the executive view.</p>
          </div>
        </div>
        <Button onClick={saveAll} disabled={saving} className="gap-2">
          <Save className="size-4" />
          {saving ? "Saving…" : "Save all & return"}
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {department.metrics.map((metric) => {
          const data = initForm(metric)
          return (
            <Card key={metric.id}>
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <CardTitle className="text-base">{metric.name}</CardTitle>
                    <CardDescription>
                      Current: {metric.value}
                      {metric.unit ? ` ${metric.unit}` : ""}
                    </CardDescription>
                    {usesMonthlyBreakdown(metric.id) && (
                      <CardDescription className="pt-2 text-foreground">
                        <Link
                          href={`/dashboard/kpi/metric/${segmentId}/${metric.id}`}
                          className="text-primary underline underline-offset-2"
                        >
                          Open the metric page
                        </Link>{" "}
                        {metric.id === "fin-inventory-levels"
                          ? "to enter inventory by variety. The headline shows the largest holding; ranks 2–4 are derived from the table."
                          : "to enter month-by-month figures. The headline value is calculated from those entries."}
                      </CardDescription>
                    )}
                  </div>
                  <Badge className={cn("text-xs", statusColors[data.status])}>
                    {data.status.charAt(0).toUpperCase() + data.status.slice(1)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Value {metric.unit && `(${metric.unit})`}</Label>
                    <Input
                      value={data.value}
                      onChange={(e) => patchForm(metric.id, { value: e.target.value })}
                      placeholder="Enter value"
                      disabled={usesMonthlyBreakdown(metric.id)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Status</Label>
                    <Select
                      value={data.status}
                      onValueChange={(v: MetricStatus) => patchForm(metric.id, { status: v })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="green">Green — on track</SelectItem>
                        <SelectItem value="amber">Amber — needs attention</SelectItem>
                        <SelectItem value="red">Red — critical</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Trend</Label>
                  <Select
                    value={data.trend}
                    onValueChange={(v: "up" | "down" | "stable") => patchForm(metric.id, { trend: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="up">Up</SelectItem>
                      <SelectItem value="down">Down</SelectItem>
                      <SelectItem value="stable">Stable</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Additional details</Label>
                  <Input
                    value={data.details}
                    onChange={(e) => patchForm(metric.id, { details: e.target.value })}
                    placeholder="Optional"
                    disabled={usesMonthlyBreakdown(metric.id)}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-1">
                    <MessageSquare className="size-4" />
                    Comment (optional)
                  </Label>
                  <Textarea
                    value={data.comment}
                    onChange={(e) => patchForm(metric.id, { comment: e.target.value })}
                    placeholder="Note for the record…"
                    className="min-h-16"
                  />
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  disabled={saving}
                  onClick={() => saveMetric(metric.id)}
                >
                  Save this metric
                </Button>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
