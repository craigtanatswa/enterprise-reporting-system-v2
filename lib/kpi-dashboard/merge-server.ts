import type { SupabaseClient } from "@supabase/supabase-js"
import { initialDepartments, initialMDComments, getDepartmentScorecard } from "@/lib/kpi-dashboard/initial-data"
import { executiveMetricSourceDetail } from "@/lib/kpi-dashboard/executive-bindings"
import type { Comment, DepartmentData, MDComment, MetricData, MetricStatus } from "@/lib/kpi-dashboard/types"
import {
  deriveSalesRevenueYtd,
  deriveVolumeVarietyKpi,
  type RevenueMonthlyRow,
  type VolumeMonthlyRow,
} from "@/lib/kpi-dashboard/sales-monthly-metrics"

export type KpiMetricOverrideRow = {
  segment_id: string
  metric_id: string
  value_numeric: number | null
  value_text: string | null
  details: string | null
  status: MetricStatus | null
  trend: "up" | "down" | "stable" | null
  previous_numeric: number | null
  previous_text: string | null
  updated_at: string
}

type DeptCommentRow = {
  id: string
  segment_id: string
  metric_id: string
  author_display: string
  body: string
  created_at: string
}

type MdCommentRow = {
  id: string
  segment_id: string
  metric_id: string | null
  body: string
  is_read: boolean
  created_at: string
}

export function applyMetricOverride(metric: MetricData, row: KpiMetricOverrideRow): MetricData {
  const value =
    row.value_text !== null && row.value_text !== undefined && row.value_text !== ""
      ? row.value_text
      : row.value_numeric !== null && row.value_numeric !== undefined
        ? row.value_numeric
        : metric.value

  const previousValue =
    row.previous_text !== null && row.previous_text !== undefined && row.previous_text !== ""
      ? row.previous_text
      : row.previous_numeric !== null && row.previous_numeric !== undefined
        ? row.previous_numeric
        : metric.previousValue

  return {
    ...metric,
    value,
    details: row.details ?? metric.details,
    status: row.status ?? metric.status,
    trend: row.trend ?? metric.trend,
    previousValue,
    lastUpdated: row.updated_at,
  }
}

function groupDeptComments(rows: DeptCommentRow[]) {
  const m = new Map<string, DeptCommentRow[]>()
  for (const r of rows) {
    const k = `${r.segment_id}\0${r.metric_id}`
    const arr = m.get(k) ?? []
    arr.push(r)
    m.set(k, arr)
  }
  return m
}

function syncExecutiveFromDepartmentMetrics(departments: DepartmentData[]) {
  const bySeg = new Map(departments.map((d) => [d.id, d]))

  const exec = departments.find((d) => d.id === "executive")
  if (!exec) return

  for (const [execMetricId, src] of Object.entries(executiveMetricSourceDetail)) {
    const dept = bySeg.get(src.segmentId)
    if (!dept) continue
    const srcMetric = dept.metrics.find((m) => m.id === src.metricId)
    if (!srcMetric) continue
    const target = exec.metrics.find((m) => m.id === execMetricId)
    if (!target) continue
    target.value = srcMetric.value
    target.unit = srcMetric.unit
    target.target = srcMetric.target
    target.previousValue = srcMetric.previousValue
    target.status = srcMetric.status
    target.trend = srcMetric.trend
    target.details = srcMetric.details
    target.lastUpdated = srcMetric.lastUpdated
  }
}

export async function loadKpiDashboardState(supabase: SupabaseClient): Promise<{
  departments: DepartmentData[]
  mdComments: MDComment[]
  scorecard: ReturnType<typeof getDepartmentScorecard>
}> {
  const base = structuredClone(initialDepartments) as DepartmentData[]

  let overrides: KpiMetricOverrideRow[] = []
  let deptCommentList: DeptCommentRow[] = []
  let mdRows: MdCommentRow[] = []

  try {
    const [o, c, m] = await Promise.all([
      supabase.from("kpi_metric_overrides").select("*"),
      supabase.from("kpi_department_comments").select("*").order("created_at", { ascending: false }),
      supabase.from("kpi_md_comments").select("*").order("created_at", { ascending: false }),
    ])
    if (!o.error) overrides = (o.data ?? []) as KpiMetricOverrideRow[]
    if (!c.error) deptCommentList = (c.data ?? []) as DeptCommentRow[]
    if (!m.error) mdRows = (m.data ?? []) as MdCommentRow[]
  } catch {
    // Tables may not exist until migration is applied; use seed-only data.
  }

  const overrideByKey = new Map<string, KpiMetricOverrideRow>()
  for (const row of overrides) {
    overrideByKey.set(`${row.segment_id}\0${row.metric_id}`, row)
  }

  const commentsByKey = groupDeptComments(deptCommentList)

  for (const dept of base) {
    for (const metric of dept.metrics) {
      const o = overrideByKey.get(`${dept.id}\0${metric.id}`)
      if (o) Object.assign(metric, applyMetricOverride(metric, o))
      const dbComments = commentsByKey.get(`${dept.id}\0${metric.id}`) ?? []
      const asComments: Comment[] = dbComments.map((c) => ({
        id: c.id,
        author: c.author_display,
        content: c.body,
        timestamp: c.created_at,
      }))
      if (asComments.length > 0) {
        metric.comments = asComments
      }
    }
  }

  try {
    const salesSeg = "sales-marketing"
    const now = new Date()
    const y = now.getFullYear()
    const [revRes, volRes] = await Promise.all([
      supabase
        .from("kpi_sales_revenue_monthly")
        .select("month,amount_usd,updated_at")
        .eq("segment_id", salesSeg)
        .eq("year", y),
      supabase
        .from("kpi_sales_volume_monthly")
        .select("month,variety_id,volume_tonnes,updated_at")
        .eq("segment_id", salesSeg)
        .eq("year", y),
    ])
    const sm = base.find((d) => d.id === salesSeg)
    if (sm && !revRes.error && revRes.data?.length) {
      const derived = deriveSalesRevenueYtd(revRes.data as RevenueMonthlyRow[], y, now)
      const m = sm.metrics.find((x) => x.id === "sales-revenue")
      if (derived && m) {
        m.value = derived.ytd
        m.lastUpdated = derived.lastUpdated
        m.details =
          "YTD total is the sum of monthly entries for the current calendar year (through the current month)."
      }
    }
    if (sm && !volRes.error && volRes.data?.length) {
      const derived = deriveVolumeVarietyKpi(volRes.data as VolumeMonthlyRow[], y, now)
      const m = sm.metrics.find((x) => x.id === "sales-volume-variety")
      if (derived && m) {
        m.value = derived.value
        m.details = derived.details
        m.lastUpdated = derived.lastUpdated
        m.unit = undefined
      }
    }
  } catch {
    // Tables may not exist until migration 021 is applied.
  }

  syncExecutiveFromDepartmentMetrics(base)

  const mdFromDb: MDComment[] = mdRows.map((r) => ({
    id: r.id,
    departmentId: r.segment_id,
    metricId: r.metric_id ?? undefined,
    content: r.body,
    timestamp: r.created_at,
    isRead: r.is_read,
  }))

  const mdComments = mdFromDb.length > 0 ? mdFromDb : [...initialMDComments]

  return {
    departments: base,
    mdComments,
    scorecard: getDepartmentScorecard(base),
  }
}
