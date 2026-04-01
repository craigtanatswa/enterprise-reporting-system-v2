"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import { ArrowLeft, Clock, User, Send, MessageSquare, Crown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import type { MetricStatus } from "@/lib/kpi-dashboard/types"
import { useKpiDashboard } from "@/components/kpi-dashboard/kpi-dashboard-provider"
import {
  addKpiDepartmentCommentAction,
  addKpiMdCommentAction,
} from "@/app/actions/kpi-dashboard"

const statusColors: Record<MetricStatus, string> = {
  green: "bg-[oklch(0.6_0.15_145)] text-white",
  amber: "bg-[oklch(0.75_0.12_85)] text-[oklch(0.25_0.02_85)]",
  red: "bg-[oklch(0.6_0.2_25)] text-white",
}

export function KpiMetricDetail({ segmentId, metricId }: { segmentId: string; metricId: string }) {
  const router = useRouter()
  const {
    getDepartment,
    getMetric,
    viewerIsMd,
    canEditDepartmentMetrics,
    mdComments,
    refresh,
  } = useKpiDashboard()

  const [newComment, setNewComment] = useState("")
  const [newMDComment, setNewMDComment] = useState("")
  const [pending, setPending] = useState(false)

  const department = getDepartment(segmentId)
  const metric = getMetric(segmentId, metricId)
  const mdForMetric = mdComments.filter(
    (c) => c.departmentId === segmentId && c.metricId === metricId
  )

  if (!department || !metric) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <p className="text-muted-foreground">Metric not found</p>
        <Button variant="outline" className="mt-4" onClick={() => router.push("/dashboard/kpi")}>
          Back
        </Button>
      </div>
    )
  }

  const formatDate = (timestamp: string) =>
    new Date(timestamp).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })

  const status = metric.status || "green"

  const submitDeptComment = async () => {
    if (!newComment.trim() || !canEditDepartmentMetrics) return
    setPending(true)
    await addKpiDepartmentCommentAction({
      segmentId,
      metricId,
      body: newComment.trim(),
    })
    setNewComment("")
    setPending(false)
    refresh()
  }

  const submitMdComment = async () => {
    if (!newMDComment.trim() || !viewerIsMd) return
    setPending(true)
    await addKpiMdCommentAction({
      segmentId,
      metricId,
      body: newMDComment.trim(),
    })
    setNewMDComment("")
    setPending(false)
    refresh()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.push("/dashboard/kpi")}>
          <ArrowLeft className="size-5" />
        </Button>
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold text-foreground">{metric.name}</h1>
            <Badge className={cn("text-xs", statusColors[status])}>
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </Badge>
          </div>
          <p className="text-muted-foreground">
            {department.name} — {department.head}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Metric details</CardTitle>
              <CardDescription>Last updated: {formatDate(metric.lastUpdated)}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Current value</p>
                  <p className="text-3xl font-bold text-foreground">
                    {metric.value}
                    {metric.unit && (
                      <span className="ml-1 text-lg font-normal text-muted-foreground">{metric.unit}</span>
                    )}
                  </p>
                </div>
                {metric.target != null && (
                  <div>
                    <p className="text-sm text-muted-foreground">Target</p>
                    <p className="text-3xl font-bold text-foreground">
                      {metric.target}
                      {metric.unit && (
                        <span className="ml-1 text-lg font-normal text-muted-foreground">{metric.unit}</span>
                      )}
                    </p>
                  </div>
                )}
              </div>
              {metric.previousValue != null && (
                <div>
                  <p className="text-sm text-muted-foreground">Previous value</p>
                  <p className="text-lg text-foreground">
                    {metric.previousValue}
                    {metric.unit && ` ${metric.unit}`}
                  </p>
                </div>
              )}
              {metric.details && (
                <div>
                  <p className="text-sm text-muted-foreground">Additional details</p>
                  <p className="text-foreground">{metric.details}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {mdForMetric.length > 0 && (
            <Card className="border-[oklch(0.75_0.12_85)]">
              <CardHeader className="bg-[oklch(0.75_0.12_85)]/10">
                <CardTitle className="flex items-center gap-2">
                  <Crown className="size-5 text-[oklch(0.65_0.15_85)]" />
                  MD feedback
                </CardTitle>
                <CardDescription>Managing Director comments on this metric</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 pt-4">
                {mdForMetric.map((comment) => (
                  <div key={comment.id} className="rounded-lg border bg-[oklch(0.75_0.12_85)]/5 p-4">
                    <div className="mb-2 flex flex-wrap items-center gap-2 text-sm">
                      <Crown className="size-4 text-[oklch(0.65_0.15_85)]" />
                      <span className="font-medium">Managing Director</span>
                      <span className="text-muted-foreground">|</span>
                      <Clock className="size-3 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">{formatDate(comment.timestamp)}</span>
                    </div>
                    <p className="text-foreground">{comment.content}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {viewerIsMd && (
            <Card className="border-[oklch(0.75_0.12_85)]">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Crown className="size-5 text-[oklch(0.65_0.15_85)]" />
                  Add MD feedback
                </CardTitle>
                <CardDescription>Message {department.head} about this metric</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <Textarea
                    placeholder="Feedback for the department…"
                    value={newMDComment}
                    onChange={(e) => setNewMDComment(e.target.value)}
                    className="min-h-20"
                  />
                  <Button
                    onClick={submitMdComment}
                    disabled={pending}
                    size="icon"
                    className="shrink-0 bg-[oklch(0.65_0.15_85)] hover:bg-[oklch(0.55_0.15_85)]"
                  >
                    <Send className="size-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="size-5" />
                Department comments
              </CardTitle>
              <CardDescription>Context and notes on this metric</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {canEditDepartmentMetrics && (
                <div className="flex gap-2">
                  <Textarea
                    placeholder="Add a comment…"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    className="min-h-20"
                  />
                  <Button onClick={submitDeptComment} disabled={pending} size="icon" className="shrink-0">
                    <Send className="size-4" />
                  </Button>
                </div>
              )}

              {metric.comments.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">No comments yet</p>
              ) : (
                <div className="space-y-4">
                  {metric.comments.map((comment) => (
                    <div key={comment.id} className="rounded-lg border bg-muted/30 p-4">
                      <div className="mb-2 flex flex-wrap items-center gap-2 text-sm">
                        <User className="size-4 text-muted-foreground" />
                        <span className="font-medium">{comment.author}</span>
                        <span className="text-muted-foreground">|</span>
                        <Clock className="size-3 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">{formatDate(comment.timestamp)}</span>
                      </div>
                      <p className="text-foreground">{comment.content}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Quick info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between gap-2 text-sm">
                <span className="text-muted-foreground">Department</span>
                <span className="font-medium">{department.shortName}</span>
              </div>
              <Separator />
              <div className="flex justify-between gap-2 text-sm">
                <span className="text-muted-foreground">Trend</span>
                <span className="font-medium capitalize">{metric.trend || "—"}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
