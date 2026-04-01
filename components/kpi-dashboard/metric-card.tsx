"use client"

import { TrendingUp, TrendingDown, Minus, MessageSquare } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type { MetricData, MetricStatus } from "@/lib/kpi-dashboard/types"

interface MetricCardProps {
  metric: MetricData
  onClick?: () => void
  showCommentIndicator?: boolean
  className?: string
}

const statusColors: Record<MetricStatus, string> = {
  green: "bg-[oklch(0.6_0.15_145)] text-white",
  amber: "bg-[oklch(0.75_0.12_85)] text-[oklch(0.25_0.02_85)]",
  red: "bg-[oklch(0.6_0.2_25)] text-white",
}

const statusBorderColors: Record<MetricStatus, string> = {
  green: "border-l-[oklch(0.6_0.15_145)]",
  amber: "border-l-[oklch(0.75_0.12_85)]",
  red: "border-l-[oklch(0.6_0.2_25)]",
}

function formatValue(value: number | string, unit?: string): string {
  if (typeof value === "number") {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(2)}M${unit ? ` ${unit}` : ""}`
    }
    if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}K${unit ? ` ${unit}` : ""}`
    }
    return `${value}${unit ? ` ${unit}` : ""}`
  }
  return `${value}${unit ? ` ${unit}` : ""}`
}

export function KpiMetricCard({
  metric,
  onClick,
  showCommentIndicator = true,
  className,
}: MetricCardProps) {
  const status = metric.status || "green"
  const hasComments = metric.comments.length > 0

  return (
    <Card
      className={cn(
        "cursor-pointer transition-all hover:shadow-md border-l-4",
        statusBorderColors[status],
        onClick && "hover:scale-[1.02]",
        className
      )}
      onClick={onClick}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-sm font-medium text-muted-foreground leading-tight">{metric.name}</CardTitle>
          <div className="flex items-center gap-1">
            {showCommentIndicator && hasComments && (
              <div className="flex items-center text-muted-foreground">
                <MessageSquare className="size-3.5" />
                <span className="text-xs ml-0.5">{metric.comments.length}</span>
              </div>
            )}
            <Badge className={cn("text-xs", statusColors[status])}>
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-end justify-between">
          <div>
            <p className="text-2xl font-bold text-foreground">{formatValue(metric.value, metric.unit)}</p>
            {metric.target && typeof metric.value === "number" && (
              <p className="text-xs text-muted-foreground mt-1">
                Target: {formatValue(metric.target, metric.unit)} ({Math.round((metric.value / metric.target) * 100)}%)
              </p>
            )}
            {metric.details && (
              <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{metric.details}</p>
            )}
          </div>
          {metric.trend && (
            <div
              className={cn(
                "flex items-center gap-1 text-sm",
                metric.trend === "up" && "text-[oklch(0.5_0.15_145)]",
                metric.trend === "down" && "text-[oklch(0.5_0.2_25)]",
                metric.trend === "stable" && "text-muted-foreground"
              )}
            >
              {metric.trend === "up" && <TrendingUp className="size-4" />}
              {metric.trend === "down" && <TrendingDown className="size-4" />}
              {metric.trend === "stable" && <Minus className="size-4" />}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
