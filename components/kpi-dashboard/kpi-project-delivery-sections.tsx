"use client"

import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import type { ProjectDeliveryDetails } from "@/lib/kpi-dashboard/project-delivery-metric"

const fieldClass = "min-h-[4.5rem] resize-y"

function Section({
  title,
  body,
  readOnly,
}: {
  title: string
  body: string
  readOnly: boolean
}) {
  if (!body.trim() && readOnly) return null
  return (
    <div className="space-y-1">
      <p className="text-sm font-medium text-foreground">{title}</p>
      {readOnly ? (
        <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">{body.trim() || "—"}</p>
      ) : null}
    </div>
  )
}

export function KpiProjectDeliverySections({
  data,
  onChange,
  readOnly,
}: {
  data: ProjectDeliveryDetails
  onChange?: (next: ProjectDeliveryDetails) => void
  readOnly?: boolean
}) {
  const ro = Boolean(readOnly)
  const patch = (partial: Partial<ProjectDeliveryDetails>) => {
    if (!onChange) return
    onChange({ ...data, ...partial })
  }

  if (ro) {
    return (
      <div className="space-y-4">
        <Section title="Project portfolio" body={data.portfolio} readOnly />
        <Section title="Timeline performance (planned vs actual milestones)" body={data.timeline} readOnly />
        <Section title="Budget performance (project budgets vs actual spend)" body={data.budget} readOnly />
        <Section title="Issues (causes of delays)" body={data.issues} readOnly />
        <Section title="Contractor / vendor performance" body={data.contractors} readOnly />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Schedule label</Label>
          <Input
            value={data.scheduleLabel}
            onChange={(e) => patch({ scheduleLabel: e.target.value })}
            placeholder="e.g. on schedule"
          />
          <p className="text-xs text-muted-foreground">Shown next to the % on the dashboard (e.g. 68% on schedule).</p>
        </div>
        <div className="space-y-2">
          <Label>Projects summary</Label>
          <Input
            value={data.projectsSummary}
            onChange={(e) => patch({ projectsSummary: e.target.value })}
            placeholder="e.g. 2 of 5 delayed"
          />
          <p className="text-xs text-muted-foreground">One line under the headline on the scorecard.</p>
        </div>
      </div>
      <Separator />
      <div className="space-y-2">
        <Label>Project portfolio (list all projects and status: On track / Delayed / Completed)</Label>
        <Textarea
          className={fieldClass}
          value={data.portfolio}
          onChange={(e) => patch({ portfolio: e.target.value })}
          placeholder="One project per line…"
        />
      </div>
      <div className="space-y-2">
        <Label>Timeline performance (planned vs actual milestones)</Label>
        <Textarea
          className={fieldClass}
          value={data.timeline}
          onChange={(e) => patch({ timeline: e.target.value })}
          placeholder="Key milestones and variance…"
        />
      </div>
      <div className="space-y-2">
        <Label>Budget performance (project budgets vs actual spend)</Label>
        <Textarea
          className={fieldClass}
          value={data.budget}
          onChange={(e) => patch({ budget: e.target.value })}
          placeholder="Budget vs actual by project…"
        />
      </div>
      <div className="space-y-2">
        <Label>Issues (causes of delays)</Label>
        <Textarea
          className={fieldClass}
          value={data.issues}
          onChange={(e) => patch({ issues: e.target.value })}
          placeholder="Root causes and mitigations…"
        />
      </div>
      <div className="space-y-2">
        <Label>Contractor / vendor performance</Label>
        <Textarea
          className={fieldClass}
          value={data.contractors}
          onChange={(e) => patch({ contractors: e.target.value })}
          placeholder="Delivery quality, timeliness, etc."
        />
      </div>
    </div>
  )
}
