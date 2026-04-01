"use client"

import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import {
  ArrowLeft,
  Clock,
  Send,
  MessageSquare,
  ExternalLink,
  CheckCircle,
  AlertCircle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { useKpiDashboard } from "@/components/kpi-dashboard/kpi-dashboard-provider"
import { addKpiMdCommentAction } from "@/app/actions/kpi-dashboard"

export function KpiMdCommentsView({ segmentId }: { segmentId: string }) {
  const router = useRouter()
  const {
    getDepartment,
    viewerIsMd,
    mdComments,
    hasFullKpiAccess,
    primarySegment,
    markAllDepartmentCommentsRead,
    markMDCommentRead,
    refresh,
  } = useKpiDashboard()

  const [newComment, setNewComment] = useState("")
  const [selectedMetric, setSelectedMetric] = useState("general")
  const [pending, setPending] = useState(false)

  const department = getDepartment(segmentId)
  const list = mdComments.filter((c) => c.departmentId === segmentId)

  const isDepartmentViewer = !hasFullKpiAccess && primarySegment === segmentId

  useEffect(() => {
    if (isDepartmentViewer) {
      void markAllDepartmentCommentsRead(segmentId)
    }
  }, [isDepartmentViewer, segmentId, markAllDepartmentCommentsRead])

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

  const formatDate = (timestamp: string) =>
    new Date(timestamp).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })

  const getMetricName = (metricId?: string) => {
    if (!metricId) return "General department feedback"
    const metric = department.metrics.find((m) => m.id === metricId)
    return metric?.name || "Unknown metric"
  }

  const submit = async () => {
    if (!newComment.trim() || !viewerIsMd) return
    setPending(true)
    await addKpiMdCommentAction({
      segmentId,
      metricId: selectedMetric === "general" ? undefined : selectedMetric,
      body: newComment.trim(),
    })
    setNewComment("")
    setSelectedMetric("general")
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
          <h1 className="text-2xl font-bold text-foreground">
            {viewerIsMd ? "Comments to" : "MD feedback for"} {department.name}
          </h1>
          <p className="text-muted-foreground">
            {viewerIsMd
              ? `Communicate with ${department.head}`
              : "Feedback from the Managing Director"}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {viewerIsMd && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="size-5" />
                  New comment
                </CardTitle>
                <CardDescription>Send feedback to {department.head}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Related to</Label>
                  <Select value={selectedMetric} onValueChange={setSelectedMetric}>
                    <SelectTrigger>
                      <SelectValue placeholder="General or specific metric" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="general">General department feedback</SelectItem>
                      {department.metrics.map((metric) => (
                        <SelectItem key={metric.id} value={metric.id}>
                          {metric.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Your comment</Label>
                  <Textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    className="min-h-24"
                    placeholder="Enter feedback…"
                  />
                </div>
                <Button onClick={submit} disabled={pending} className="w-full">
                  <Send className="mr-2 size-4" />
                  Send comment
                </Button>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>{viewerIsMd ? "Comment history" : "MD comments"}</CardTitle>
              <CardDescription>
                {list.length} comment{list.length !== 1 ? "s" : ""}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {list.length === 0 ? (
                <div className="py-12 text-center text-muted-foreground">
                  <MessageSquare className="mx-auto mb-4 size-12 opacity-30" />
                  <p className="font-medium">No comments yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {list.map((comment) => (
                    <div
                      key={comment.id}
                      role={isDepartmentViewer && !comment.isRead ? "button" : undefined}
                      className={cn(
                        "rounded-lg border p-4 transition-colors",
                        !comment.isRead && isDepartmentViewer
                          ? "border-[oklch(0.75_0.12_85)] bg-[oklch(0.75_0.12_85)]/10"
                          : "bg-muted/30"
                      )}
                      onClick={() => {
                        if (isDepartmentViewer && !comment.isRead) {
                          void markMDCommentRead(comment.id)
                        }
                      }}
                    >
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0 flex-1">
                          <div className="mb-2 flex flex-wrap items-center gap-2">
                            <Badge variant={comment.metricId ? "default" : "secondary"}>
                              {getMetricName(comment.metricId)}
                            </Badge>
                            {!comment.isRead && isDepartmentViewer && (
                              <Badge className="bg-[oklch(0.6_0.2_25)] text-white">
                                <AlertCircle className="mr-1 size-3" />
                                New
                              </Badge>
                            )}
                            {comment.isRead && <CheckCircle className="size-4 text-muted-foreground" />}
                          </div>
                          <p className="mb-3 text-foreground">{comment.content}</p>
                          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                            <Clock className="size-3" />
                            <span>{formatDate(comment.timestamp)}</span>
                            <span>|</span>
                            <span>From: Managing Director</span>
                          </div>
                        </div>
                        {comment.metricId && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="shrink-0"
                            onClick={(e) => {
                              e.stopPropagation()
                              router.push(`/dashboard/kpi/metric/${segmentId}/${comment.metricId}`)
                            }}
                          >
                            <ExternalLink className="mr-1 size-4" />
                            View metric
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Department</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>
              <span className="text-muted-foreground">Head:</span> {department.head}
            </p>
            <p>
              <span className="text-muted-foreground">Metrics:</span> {department.metrics.length}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
