"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import {
  canPostMdKpiComments,
  getKpiSegmentForProfile,
  userMayUpdateSegment,
} from "@/lib/kpi-dashboard/segment-map"
import type { Department, SubDepartment } from "@/lib/utils/permissions"
import type { UserRole } from "@/lib/utils/permissions"
import type { MetricStatus } from "@/lib/kpi-dashboard/types"
import { applyMetricOverride, type KpiMetricOverrideRow } from "@/lib/kpi-dashboard/merge-server"
import { initialDepartments } from "@/lib/kpi-dashboard/initial-data"

function findSeedMetric(segmentId: string, metricId: string) {
  const dept = initialDepartments.find((d) => d.id === segmentId)
  return dept?.metrics.find((m) => m.id === metricId)
}

export async function updateKpiMetricAction(input: {
  segmentId: string
  metricId: string
  value: string
  status: MetricStatus
  trend: "up" | "down" | "stable"
  details: string
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false as const, error: "Unauthorized" }

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()
  if (!profile?.is_active) return { ok: false as const, error: "Inactive" }

  const role = profile.role as UserRole
  const dept = profile.department as Department | null
  const sub = profile.sub_department as SubDepartment | null

  if (!userMayUpdateSegment(role, dept, sub, input.segmentId)) {
    return { ok: false as const, error: "Forbidden" }
  }

  const seed = findSeedMetric(input.segmentId, input.metricId)
  if (!seed) return { ok: false as const, error: "Unknown metric" }

  const { data: existingRow } = await supabase
    .from("kpi_metric_overrides")
    .select("*")
    .eq("segment_id", input.segmentId)
    .eq("metric_id", input.metricId)
    .maybeSingle()

  const current = existingRow ? applyMetricOverride(seed, existingRow as KpiMetricOverrideRow) : seed

  const trimmed = input.value.trim()
  const pureNumber = /^-?\d+(\.\d+)?([eE][+-]?\d+)?$/.test(trimmed)
  let valueNumeric: number | null = null
  let valueText: string | null = null
  if (pureNumber) {
    valueNumeric = parseFloat(trimmed)
  } else {
    valueText = trimmed
  }

  const prevNum = typeof current.value === "number" ? current.value : null
  const prevText = typeof current.value === "string" ? current.value : null

  const { error } = await supabase.from("kpi_metric_overrides").upsert(
    {
      segment_id: input.segmentId,
      metric_id: input.metricId,
      value_numeric: valueNumeric,
      value_text: valueText,
      details: input.details || null,
      status: input.status,
      trend: input.trend,
      previous_numeric: prevNum,
      previous_text: prevText,
      updated_at: new Date().toISOString(),
      updated_by: user.id,
    },
    { onConflict: "segment_id,metric_id" }
  )

  if (error) return { ok: false as const, error: error.message }

  revalidatePath("/dashboard/kpi")
  revalidatePath("/dashboard/md/kpi")
  revalidatePath("/dashboard/kpi/metric/[segment]/[metricId]", "page")

  return { ok: true as const }
}

export async function addKpiDepartmentCommentAction(input: {
  segmentId: string
  metricId: string
  body: string
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false as const, error: "Unauthorized" }

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()
  if (!profile?.is_active) return { ok: false as const, error: "Inactive" }

  const role = profile.role as UserRole
  const dept = profile.department as Department | null
  const sub = profile.sub_department as SubDepartment | null

  if (!userMayUpdateSegment(role, dept, sub, input.segmentId)) {
    return { ok: false as const, error: "Forbidden" }
  }

  const display = profile.full_name?.trim() || profile.email || "Department user"

  const { error } = await supabase.from("kpi_department_comments").insert({
    segment_id: input.segmentId,
    metric_id: input.metricId,
    author_id: user.id,
    author_display: display,
    body: input.body.trim(),
  })

  if (error) return { ok: false as const, error: error.message }

  revalidatePath("/dashboard/kpi")
  revalidatePath("/dashboard/kpi/metric/[segment]/[metricId]", "page")
  return { ok: true as const }
}

export async function addKpiMdCommentAction(input: {
  segmentId: string
  metricId?: string
  body: string
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false as const, error: "Unauthorized" }

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()
  if (!profile?.is_active) return { ok: false as const, error: "Inactive" }

  const role = profile.role as UserRole
  if (!canPostMdKpiComments(role)) {
    return { ok: false as const, error: "Forbidden" }
  }

  const targetSeg = input.segmentId
  const validSegment = initialDepartments.some((d) => d.id === targetSeg && d.id !== "executive")
  if (!validSegment) {
    return { ok: false as const, error: "Invalid segment" }
  }

  const { error } = await supabase.from("kpi_md_comments").insert({
    segment_id: input.segmentId,
    metric_id: input.metricId ?? null,
    author_id: user.id,
    body: input.body.trim(),
    is_read: false,
  })

  if (error) return { ok: false as const, error: error.message }

  revalidatePath("/dashboard/kpi/md-comments/[segment]", "page")
  revalidatePath("/dashboard/md/kpi")
  return { ok: true as const }
}

export async function markKpiMdCommentReadAction(commentId: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false as const, error: "Unauthorized" }

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()
  if (!profile?.is_active) return { ok: false as const, error: "Inactive" }

  const role = profile.role as UserRole
  const dept = profile.department as Department | null
  const sub = profile.sub_department as SubDepartment | null
  const segment = getKpiSegmentForProfile(dept, sub)
  if (!segment) return { ok: false as const, error: "Forbidden" }

  const { data: row } = await supabase.from("kpi_md_comments").select("segment_id").eq("id", commentId).single()
  if (!row || row.segment_id !== segment) {
    return { ok: false as const, error: "Forbidden" }
  }

  const { error } = await supabase.from("kpi_md_comments").update({ is_read: true }).eq("id", commentId)

  if (error) return { ok: false as const, error: error.message }
  revalidatePath("/dashboard/kpi/md-comments/[segment]", "page")
  return { ok: true as const }
}

export async function markAllKpiMdCommentsReadForSegmentAction(segmentId: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false as const, error: "Unauthorized" }

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()
  if (!profile?.is_active) return { ok: false as const, error: "Inactive" }

  const role = profile.role as UserRole
  const dept = profile.department as Department | null
  const sub = profile.sub_department as SubDepartment | null
  const segment = getKpiSegmentForProfile(dept, sub)
  if (segment !== segmentId) return { ok: false as const, error: "Forbidden" }

  const { error } = await supabase
    .from("kpi_md_comments")
    .update({ is_read: true })
    .eq("segment_id", segmentId)
    .eq("is_read", false)

  if (error) return { ok: false as const, error: error.message }
  revalidatePath("/dashboard/kpi/md-comments/[segment]", "page")
  return { ok: true as const }
}
