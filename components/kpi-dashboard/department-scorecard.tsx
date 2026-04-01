"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import type { MetricStatus } from "@/lib/kpi-dashboard/types"

interface ScorecardItem {
  id: string
  name: string
  status: MetricStatus
  greenCount: number
  amberCount: number
  redCount: number
}

interface DepartmentScorecardProps {
  scorecard: ScorecardItem[]
  onDepartmentClick?: (departmentId: string) => void
}

const statusColors: Record<MetricStatus, string> = {
  green: "bg-[oklch(0.6_0.15_145)]",
  amber: "bg-[oklch(0.75_0.12_85)]",
  red: "bg-[oklch(0.6_0.2_25)]",
}

const statusTextColors: Record<MetricStatus, string> = {
  green: "text-[oklch(0.4_0.12_145)]",
  amber: "text-[oklch(0.5_0.1_85)]",
  red: "text-[oklch(0.4_0.15_25)]",
}

export function KpiDepartmentScorecard({ scorecard, onDepartmentClick }: DepartmentScorecardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Department Performance Scorecard</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {scorecard.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => onDepartmentClick?.(item.id)}
              className={cn(
                "p-3 rounded-lg border text-left transition-all hover:shadow-md",
                "bg-card hover:bg-muted/50"
              )}
            >
              <div className="flex items-center gap-2 mb-2">
                <div className={cn("size-3 rounded-full", statusColors[item.status])} />
                <span className="font-medium text-sm">{item.name}</span>
              </div>
              <div className="flex gap-2 text-xs">
                <span className={statusTextColors.green}>{item.greenCount}</span>
                <span className="text-muted-foreground">/</span>
                <span className={statusTextColors.amber}>{item.amberCount}</span>
                <span className="text-muted-foreground">/</span>
                <span className={statusTextColors.red}>{item.redCount}</span>
              </div>
            </button>
          ))}
        </div>
        <div className="flex items-center gap-4 mt-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <div className={cn("size-2.5 rounded-full", statusColors.green)} />
            <span>On Track</span>
          </div>
          <div className="flex items-center gap-1">
            <div className={cn("size-2.5 rounded-full", statusColors.amber)} />
            <span>Needs Attention</span>
          </div>
          <div className="flex items-center gap-1">
            <div className={cn("size-2.5 rounded-full", statusColors.red)} />
            <span>Critical</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
