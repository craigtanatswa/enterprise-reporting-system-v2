import type { SupabaseClient } from "@supabase/supabase-js"
import { initialDepartments, initialMDComments, getDepartmentScorecard } from "@/lib/kpi-dashboard/initial-data"
import { executiveMetricSourceDetail } from "@/lib/kpi-dashboard/executive-bindings"
import type { Comment, DepartmentData, MDComment, MetricData, MetricStatus } from "@/lib/kpi-dashboard/types"
import {
  deriveFinanceInventoryLevelsFromDbRows,
  type FinanceInventoryRow,
} from "@/lib/kpi-dashboard/finance-inventory-metrics"
import {
  deriveAgroCropProgress,
  deriveAgroHectares,
  deriveAgroInputCostPerHa,
  deriveAgroWeatherRisk,
  deriveAgroYield,
  deriveAgroYieldPerHa,
  normalizeAgronomyVarietyRow,
  type AgronomyVarietyDbRow,
} from "@/lib/kpi-dashboard/agronomy-metrics"
import {
  deriveSalesRevenueYtd,
  deriveVolumeVarietyKpi,
  type RevenueMonthlyRow,
  type VolumeMonthlyRow,
} from "@/lib/kpi-dashboard/sales-monthly-metrics"
import { deriveMfgRawReceivedKpi, type MfgRawSeedMonthlyRow } from "@/lib/kpi-dashboard/mfg-raw-seed-metrics"

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
    const financeSeg = "finance"
    const agronomySeg = "operations-agronomy"
    const mfgSeg = "operations-manufacturing"
    const [revRes, volRes, finInvRes, agroRes, mfgRawRes] = await Promise.all([
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
      supabase
        .from("kpi_finance_inventory_by_variety")
        .select("variety_id,inventory_tonnes,updated_at")
        .eq("segment_id", financeSeg),
      supabase.from("kpi_agronomy_by_variety").select("*").eq("segment_id", agronomySeg),
      supabase
        .from("kpi_mfg_raw_seed_monthly")
        .select("month,variety_id,tonnes_received,updated_at")
        .eq("segment_id", mfgSeg)
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

    const finDept = base.find((d) => d.id === financeSeg)
    const finInvData = finInvRes.data
    const finInvErr = finInvRes.error
    if (finDept && !finInvErr && finInvData != null && finInvData.length > 0) {
      const derived = deriveFinanceInventoryLevelsFromDbRows(finInvData as FinanceInventoryRow[])
      const m = finDept.metrics.find((x) => x.id === "fin-inventory-levels")
      if (derived && m) {
        m.value = derived.value
        m.unit = derived.unit
        m.details = derived.details
        m.lastUpdated = derived.lastUpdated
      }
    }

    const agDept = base.find((d) => d.id === agronomySeg)
    const agData = agroRes.data
    if (agDept && !agroRes.error && agData != null && agData.length > 0) {
      const rows = (agData as AgronomyVarietyDbRow[]).map(normalizeAgronomyVarietyRow)

      const dh = deriveAgroHectares(rows)
      const mh = agDept.metrics.find((x) => x.id === "agro-hectares")
      if (dh && mh) {
        mh.value = dh.value
        mh.unit = dh.unit
        mh.details = dh.details
        mh.lastUpdated = dh.lastUpdated
      }

      const dy = deriveAgroYield(rows)
      const my = agDept.metrics.find((x) => x.id === "agro-yield")
      if (dy && my) {
        my.value = dy.value
        my.unit = dy.unit
        my.details = dy.details
        my.lastUpdated = dy.lastUpdated
      }

      const dph = deriveAgroYieldPerHa(rows)
      const mph = agDept.metrics.find((x) => x.id === "agro-yield-per-ha")
      if (dph && mph) {
        mph.value = dph.value
        mph.unit = dph.unit
        mph.details = dph.details
        mph.lastUpdated = dph.lastUpdated
      }

      const dcp = deriveAgroCropProgress(rows)
      const mcp = agDept.metrics.find((x) => x.id === "agro-crop-progress")
      if (dcp && mcp) {
        mcp.value = dcp.value
        mcp.unit = dcp.unit
        mcp.details = dcp.details
        mcp.lastUpdated = dcp.lastUpdated
      }

      const dic = deriveAgroInputCostPerHa(rows)
      const mic = agDept.metrics.find((x) => x.id === "agro-input-cost")
      if (dic && mic) {
        mic.value = dic.value
        mic.unit = dic.unit
        mic.details = dic.details
        mic.lastUpdated = dic.lastUpdated
      }

      const dwr = deriveAgroWeatherRisk(rows)
      const mwr = agDept.metrics.find((x) => x.id === "agro-weather-risk")
      if (dwr && mwr) {
        mwr.value = dwr.value
        mwr.unit = undefined
        mwr.details = dwr.details
        mwr.lastUpdated = dwr.lastUpdated
      }
    }

    const mfgDept = base.find((d) => d.id === mfgSeg)
    const mfgRows = mfgRawRes.data
    if (mfgDept && !mfgRawRes.error && mfgRows != null && mfgRows.length > 0) {
      const normalized: MfgRawSeedMonthlyRow[] = (mfgRows as Record<string, unknown>[]).map((r) => ({
        month: Number(r.month),
        variety_id: String(r.variety_id),
        tonnes_received: Number(r.tonnes_received),
        updated_at: String(r.updated_at),
      }))
      const derived = deriveMfgRawReceivedKpi(normalized, y, now)
      const mRaw = mfgDept.metrics.find((x) => x.id === "mfg-raw-received")
      if (derived && mRaw) {
        mRaw.value = derived.value
        mRaw.unit = undefined
        mRaw.details = derived.details
        mRaw.lastUpdated = derived.lastUpdated
      }
    }
  } catch {
    // Tables may not exist until migrations 021 / 022 / 023 / 025 are applied.
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
