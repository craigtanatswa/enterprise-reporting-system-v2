"use client"

import { CheckCircle2, Clock, XCircle, Circle } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { getRoleLabel } from "@/lib/utils/permissions"

interface ApprovalStep {
  id: string
  level: number
  approver_role: string
  approver_id: { full_name: string; email: string } | null
  status: string
  comments: string | null
  responded_at: string | null
}

export function ApprovalTimeline({ steps, currentLevel }: { steps: ApprovalStep[]; currentLevel: number }) {
  const getStepIcon = (step: ApprovalStep) => {
    if (step.status === "approved") {
      return <CheckCircle2 className="h-5 w-5 text-green-500" />
    }
    if (step.status === "rejected") {
      return <XCircle className="h-5 w-5 text-destructive" />
    }
    if (step.level === currentLevel) {
      return <Clock className="h-5 w-5 text-primary" />
    }
    return <Circle className="h-5 w-5 text-muted-foreground" />
  }

  const getStepStatus = (step: ApprovalStep) => {
    if (step.status === "approved") return "Approved"
    if (step.status === "rejected") return "Rejected"
    if (step.level === currentLevel) return "Pending"
    return "Waiting"
  }

  return (
    <div className="space-y-1">
      <h3 className="font-semibold mb-4">Approval Timeline</h3>
      <div className="space-y-4">
        {steps.map((step, index) => (
          <div key={step.id} className="relative flex gap-4">
            {/* Timeline line */}
            {index < steps.length - 1 && (
              <div
                className="absolute left-2.5 top-8 bottom-0 w-0.5 bg-border"
                style={{ height: "calc(100% - 8px)" }}
              />
            )}

            {/* Icon */}
            <div className="relative z-10">{getStepIcon(step)}</div>

            {/* Content */}
            <div className="flex-1 pb-6">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-medium">Level {step.level}</span>
                <Badge variant="outline" className="text-xs">
                  {getRoleLabel(step.approver_role as any)}
                </Badge>
                <Badge variant={step.status === "pending" ? "default" : "secondary"} className="text-xs">
                  {getStepStatus(step)}
                </Badge>
              </div>

              {step.approver_id && (
                <p className="text-sm text-muted-foreground">
                  {step.approver_id.full_name} • {step.approver_id.email}
                </p>
              )}

              {step.responded_at && (
                <p className="text-xs text-muted-foreground mt-1">
                  {new Date(step.responded_at).toLocaleDateString()} at{" "}
                  {new Date(step.responded_at).toLocaleTimeString()}
                </p>
              )}

              {step.comments && (
                <div className="mt-2 rounded-md bg-muted p-2">
                  <p className="text-sm">{step.comments}</p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
