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
import { SALES_PRODUCT_VARIETIES } from "@/lib/kpi-dashboard/product-varieties"
import {
  AGRONOMY_VARIETY_TABLE_METRIC_IDS,
  normalizeAgronomyVarietyRow,
  normalizeWeatherRiskLevel,
  type AgronomyVarietyDbRow,
} from "@/lib/kpi-dashboard/agronomy-metrics"

const MFG_SEGMENT = "operations-manufacturing"

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

function revalidateKpiMetricRoutes(segmentId: string, metricId: string) {
  revalidatePath("/dashboard/kpi")
  revalidatePath("/dashboard/md/kpi")
  revalidatePath(`/dashboard/kpi/metric/${segmentId}/${metricId}`)
}

export async function upsertSalesRevenueMonthAction(input: {
  segmentId: string
  year: number
  month: number
  amountUsd: number
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

  if (input.month < 1 || input.month > 12) {
    return { ok: false as const, error: "Invalid month" }
  }

  const amount = Number(input.amountUsd)
  if (Number.isNaN(amount) || amount < 0) {
    return { ok: false as const, error: "Invalid amount" }
  }

  const { error } = await supabase.from("kpi_sales_revenue_monthly").upsert(
    {
      segment_id: input.segmentId,
      year: input.year,
      month: input.month,
      amount_usd: amount,
      updated_at: new Date().toISOString(),
      updated_by: user.id,
    },
    { onConflict: "segment_id,year,month" }
  )

  if (error) return { ok: false as const, error: error.message }

  revalidateKpiMetricRoutes(input.segmentId, "sales-revenue")
  return { ok: true as const }
}

export async function upsertSalesVolumeMonthCellAction(input: {
  segmentId: string
  year: number
  month: number
  varietyId: string
  volumeTonnes: number
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

  if (input.month < 1 || input.month > 12) {
    return { ok: false as const, error: "Invalid month" }
  }

  if (!SALES_PRODUCT_VARIETIES.some((v) => v.id === input.varietyId)) {
    return { ok: false as const, error: "Unknown variety" }
  }

  const vol = Number(input.volumeTonnes)
  if (Number.isNaN(vol) || vol < 0) {
    return { ok: false as const, error: "Invalid volume" }
  }

  const { error } = await supabase.from("kpi_sales_volume_monthly").upsert(
    {
      segment_id: input.segmentId,
      year: input.year,
      month: input.month,
      variety_id: input.varietyId,
      volume_tonnes: vol,
      updated_at: new Date().toISOString(),
      updated_by: user.id,
    },
    { onConflict: "segment_id,year,month,variety_id" }
  )

  if (error) return { ok: false as const, error: error.message }

  revalidateKpiMetricRoutes(input.segmentId, "sales-volume-variety")
  return { ok: true as const }
}

export async function upsertMfgRawSeedMonthCellAction(input: {
  segmentId: string
  year: number
  month: number
  varietyId: string
  tonnesReceived: number
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

  if (input.segmentId !== MFG_SEGMENT) {
    return { ok: false as const, error: "Invalid segment" }
  }

  if (input.month < 1 || input.month > 12) {
    return { ok: false as const, error: "Invalid month" }
  }

  if (!SALES_PRODUCT_VARIETIES.some((v) => v.id === input.varietyId)) {
    return { ok: false as const, error: "Unknown variety" }
  }

  const tonnes = Number(input.tonnesReceived)
  if (Number.isNaN(tonnes) || tonnes < 0) {
    return { ok: false as const, error: "Invalid tonnes" }
  }

  const { error } = await supabase.from("kpi_mfg_raw_seed_monthly").upsert(
    {
      segment_id: input.segmentId,
      year: input.year,
      month: input.month,
      variety_id: input.varietyId,
      tonnes_received: tonnes,
      updated_at: new Date().toISOString(),
      updated_by: user.id,
    },
    { onConflict: "segment_id,year,month,variety_id" }
  )

  if (error) return { ok: false as const, error: error.message }

  revalidateKpiMetricRoutes(input.segmentId, "mfg-raw-received")
  return { ok: true as const }
}

export async function upsertMfgProcessedOutputMonthCellAction(input: {
  segmentId: string
  year: number
  month: number
  varietyId: string
  tonnesProcessed: number
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

  if (input.segmentId !== MFG_SEGMENT) {
    return { ok: false as const, error: "Invalid segment" }
  }

  if (input.month < 1 || input.month > 12) {
    return { ok: false as const, error: "Invalid month" }
  }

  if (!SALES_PRODUCT_VARIETIES.some((v) => v.id === input.varietyId)) {
    return { ok: false as const, error: "Unknown variety" }
  }

  const tonnes = Number(input.tonnesProcessed)
  if (Number.isNaN(tonnes) || tonnes < 0) {
    return { ok: false as const, error: "Invalid tonnes" }
  }

  const { error } = await supabase.from("kpi_mfg_processed_output_monthly").upsert(
    {
      segment_id: input.segmentId,
      year: input.year,
      month: input.month,
      variety_id: input.varietyId,
      tonnes_processed: tonnes,
      updated_at: new Date().toISOString(),
      updated_by: user.id,
    },
    { onConflict: "segment_id,year,month,variety_id" }
  )

  if (error) return { ok: false as const, error: error.message }

  revalidateKpiMetricRoutes(input.segmentId, "mfg-processed-output")
  return { ok: true as const }
}

export async function upsertMfgPackagedSeedMonthCellAction(input: {
  segmentId: string
  year: number
  month: number
  varietyId: string
  tonnesPackaged: number
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

  if (input.segmentId !== MFG_SEGMENT) {
    return { ok: false as const, error: "Invalid segment" }
  }

  if (input.month < 1 || input.month > 12) {
    return { ok: false as const, error: "Invalid month" }
  }

  if (!SALES_PRODUCT_VARIETIES.some((v) => v.id === input.varietyId)) {
    return { ok: false as const, error: "Unknown variety" }
  }

  const tonnes = Number(input.tonnesPackaged)
  if (Number.isNaN(tonnes) || tonnes < 0) {
    return { ok: false as const, error: "Invalid tonnes" }
  }

  const { error } = await supabase.from("kpi_mfg_packaged_seed_monthly").upsert(
    {
      segment_id: input.segmentId,
      year: input.year,
      month: input.month,
      variety_id: input.varietyId,
      tonnes_packaged: tonnes,
      updated_at: new Date().toISOString(),
      updated_by: user.id,
    },
    { onConflict: "segment_id,year,month,variety_id" }
  )

  if (error) return { ok: false as const, error: error.message }

  revalidateKpiMetricRoutes(input.segmentId, "mfg-packaged")
  return { ok: true as const }
}

export async function upsertFinanceInventoryVarietyAction(input: {
  segmentId: string
  varietyId: string
  inventoryTonnes: number
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

  if (!SALES_PRODUCT_VARIETIES.some((v) => v.id === input.varietyId)) {
    return { ok: false as const, error: "Unknown variety" }
  }

  const tonnes = Number(input.inventoryTonnes)
  if (Number.isNaN(tonnes) || tonnes < 0) {
    return { ok: false as const, error: "Invalid tonnes" }
  }

  const { error } = await supabase.from("kpi_finance_inventory_by_variety").upsert(
    {
      segment_id: input.segmentId,
      variety_id: input.varietyId,
      inventory_tonnes: tonnes,
      updated_at: new Date().toISOString(),
      updated_by: user.id,
    },
    { onConflict: "segment_id,variety_id" }
  )

  if (error) return { ok: false as const, error: error.message }

  revalidateKpiMetricRoutes(input.segmentId, "fin-inventory-levels")
  return { ok: true as const }
}

const AGRONOMY_SEGMENT = "operations-agronomy"

function revalidateAllAgronomyVarietyMetricPages() {
  revalidatePath("/dashboard/kpi")
  revalidatePath("/dashboard/md/kpi")
  for (const metricId of AGRONOMY_VARIETY_TABLE_METRIC_IDS) {
    revalidatePath(`/dashboard/kpi/metric/${AGRONOMY_SEGMENT}/${metricId}`)
  }
}

export async function upsertAgronomyVarietyFieldsAction(input: {
  segmentId: string
  varietyId: string
  patch: Partial<{
    hectares_planned: number
    hectares_planted: number
    expected_yield_tonnes: number
    actual_yield_tonnes: number
    yield_per_hectare: number
    crop_progress_status: string
    variety_performance: string
    input_cost_per_hectare: number
    weather_risk_level: string
  }>
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

  if (input.segmentId !== AGRONOMY_SEGMENT) {
    return { ok: false as const, error: "Invalid segment" }
  }

  if (!SALES_PRODUCT_VARIETIES.some((v) => v.id === input.varietyId)) {
    return { ok: false as const, error: "Unknown variety" }
  }

  const keys = Object.keys(input.patch) as (keyof typeof input.patch)[]
  if (keys.length === 0) {
    return { ok: true as const }
  }

  const numericKeys = [
    "hectares_planned",
    "hectares_planted",
    "expected_yield_tonnes",
    "actual_yield_tonnes",
    "yield_per_hectare",
    "input_cost_per_hectare",
  ] as const
  for (const k of numericKeys) {
    if (input.patch[k] === undefined) continue
    const n = Number(input.patch[k])
    if (Number.isNaN(n) || n < 0) {
      return { ok: false as const, error: `Invalid ${k}` }
    }
  }

  if (input.patch.weather_risk_level !== undefined) {
    const raw = String(input.patch.weather_risk_level).trim()
    const norm = normalizeWeatherRiskLevel(raw)
    if (raw !== "" && norm === "") {
      return { ok: false as const, error: "Invalid weather risk level" }
    }
  }

  const { data: existing } = await supabase
    .from("kpi_agronomy_by_variety")
    .select("*")
    .eq("segment_id", input.segmentId)
    .eq("variety_id", input.varietyId)
    .maybeSingle()

  const base = existing
    ? normalizeAgronomyVarietyRow(existing as AgronomyVarietyDbRow)
    : {
        variety_id: input.varietyId,
        hectares_planned: 0,
        hectares_planted: 0,
        expected_yield_tonnes: 0,
        actual_yield_tonnes: 0,
        yield_per_hectare: 0,
        crop_progress_status: "",
        variety_performance: "",
        input_cost_per_hectare: 0,
        weather_risk_level: "",
        updated_at: new Date().toISOString(),
      }

  const merged = { ...base }
  for (const [k, v] of Object.entries(input.patch)) {
    if (v === undefined) continue
    if (k === "crop_progress_status" || k === "variety_performance") {
      ;(merged as Record<string, unknown>)[k] = String(v).trim()
    } else if (k === "weather_risk_level") {
      ;(merged as Record<string, unknown>)[k] = normalizeWeatherRiskLevel(String(v))
    } else {
      ;(merged as Record<string, unknown>)[k] = Number(v)
    }
  }

  const { error } = await supabase.from("kpi_agronomy_by_variety").upsert(
    {
      segment_id: input.segmentId,
      variety_id: input.varietyId,
      hectares_planned: merged.hectares_planned,
      hectares_planted: merged.hectares_planted,
      expected_yield_tonnes: merged.expected_yield_tonnes,
      actual_yield_tonnes: merged.actual_yield_tonnes,
      yield_per_hectare: merged.yield_per_hectare,
      crop_progress_status: merged.crop_progress_status,
      variety_performance: merged.variety_performance,
      input_cost_per_hectare: merged.input_cost_per_hectare,
      weather_risk_level: merged.weather_risk_level,
      updated_at: new Date().toISOString(),
      updated_by: user.id,
    },
    { onConflict: "segment_id,variety_id" }
  )

  if (error) return { ok: false as const, error: error.message }

  revalidateAllAgronomyVarietyMetricPages()
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
