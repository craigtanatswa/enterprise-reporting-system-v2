import { KpiMetricDetail } from "@/components/kpi-dashboard/kpi-metric-detail"
import { createClient } from "@/lib/supabase/server"
import { userMayAccessSegment } from "@/lib/kpi-dashboard/segment-map"
import {
  isAgronomyVarietyTableMetric,
  normalizeAgronomyVarietyRow,
  type AgronomyVarietyData,
  type AgronomyVarietyDbRow,
} from "@/lib/kpi-dashboard/agronomy-metrics"
import {
  DEFAULT_HR_HEADCOUNT_BY_DEPT,
  type HrHeadcountDepartmentKey,
} from "@/lib/kpi-dashboard/hr-headcount-departments"
import { hrHeadcountRowsToRecord, type HrHeadcountDbRow } from "@/lib/kpi-dashboard/hr-headcount-metrics"
import { SALES_PRODUCT_VARIETIES } from "@/lib/kpi-dashboard/product-varieties"
import type { Department, SubDepartment } from "@/lib/utils/permissions"
import type { UserRole } from "@/lib/utils/permissions"
import { redirect } from "next/navigation"

function emptyAgronomyVarietyRow(varietyId: string): AgronomyVarietyData {
  return {
    variety_id: varietyId,
    hectares_planned: 0,
    hectares_planted: 0,
    expected_yield_tonnes: 0,
    actual_yield_tonnes: 0,
    yield_per_hectare: 0,
    crop_progress_status: "",
    variety_performance: "",
    input_cost_per_hectare: 0,
    weather_risk_level: "",
    updated_at: new Date(0).toISOString(),
  }
}

export default async function KpiMetricPage({
  params,
}: {
  params: Promise<{ segment: string; metricId: string }>
}) {
  const { segment, metricId } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/auth/login")

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()
  if (!profile?.is_active) redirect("/auth/verify-email?error=pending-approval")

  const role = profile.role as UserRole
  const dept = profile.department as Department
  const sub = profile.sub_department as SubDepartment | null
  if (!userMayAccessSegment(role, dept, sub, segment)) {
    redirect("/dashboard")
  }

  const reportingYear = new Date().getFullYear()
  let salesRevenueByMonth: Record<number, number> | undefined
  let salesVolumeCells: Record<string, Record<number, number>> | undefined
  let mfgRawSeedCells: Record<string, Record<number, number>> | undefined
  let mfgProcessedCells: Record<string, Record<number, number>> | undefined
  let mfgPackagedCells: Record<string, Record<number, number>> | undefined
  let mfgFinishedWarehouseCells: Record<string, Record<number, number>> | undefined
  let mfgDispatchCells: Record<string, Record<number, number>> | undefined
  let mfgCostPerTonneByVariety:
    | Record<string, { cost: number; target: number }>
    | undefined
  let mfgProcessingEfficiencyByVariety:
    | Record<string, { actual: number; target: number }>
    | undefined
  let financeInventoryByVariety: Record<string, number> | undefined
  let financeProfitabilityByVariety: Record<string, number> | undefined
  let agronomyByVariety: Record<string, AgronomyVarietyData> | undefined
  let mfgTonnesTargetsByVariety: Record<string, number> | undefined
  let hrHeadcountByDepartment: Record<HrHeadcountDepartmentKey, number> | undefined

  if (
    segment === "operations-manufacturing" &&
    (metricId === "mfg-processed-output" ||
      metricId === "mfg-packaged" ||
      metricId === "mfg-finished-warehouse")
  ) {
    mfgTonnesTargetsByVariety = {}
    const { data } = await supabase
      .from("kpi_mfg_tonnes_target_by_variety")
      .select("variety_id, target_tonnes")
      .eq("segment_id", segment)
      .eq("year", reportingYear)
      .eq("metric_id", metricId)
    for (const row of data ?? []) {
      mfgTonnesTargetsByVariety[row.variety_id as string] = Number(row.target_tonnes)
    }
  }

  if (segment === "operations-agronomy" && isAgronomyVarietyTableMetric(metricId)) {
    agronomyByVariety = Object.fromEntries(
      SALES_PRODUCT_VARIETIES.map((v) => [v.id, emptyAgronomyVarietyRow(v.id)])
    )
    const { data } = await supabase
      .from("kpi_agronomy_by_variety")
      .select("*")
      .eq("segment_id", segment)
    for (const row of data ?? []) {
      const id = row.variety_id as string
      if (agronomyByVariety[id]) {
        agronomyByVariety[id] = normalizeAgronomyVarietyRow(row as AgronomyVarietyDbRow)
      }
    }
  }

  if (segment === "sales-marketing" && metricId === "sales-revenue") {
    const { data } = await supabase
      .from("kpi_sales_revenue_monthly")
      .select("month, amount_usd")
      .eq("segment_id", segment)
      .eq("year", reportingYear)
    salesRevenueByMonth = {}
    for (const row of data ?? []) {
      salesRevenueByMonth[row.month as number] = Number(row.amount_usd)
    }
  }

  if (segment === "sales-marketing" && metricId === "sales-volume-variety") {
    const { data } = await supabase
      .from("kpi_sales_volume_monthly")
      .select("month, variety_id, volume_tonnes")
      .eq("segment_id", segment)
      .eq("year", reportingYear)
    salesVolumeCells = {}
    for (const row of data ?? []) {
      const vid = row.variety_id as string
      if (!salesVolumeCells[vid]) salesVolumeCells[vid] = {}
      salesVolumeCells[vid][row.month as number] = Number(row.volume_tonnes)
    }
  }

  if (segment === "operations-manufacturing" && metricId === "mfg-raw-received") {
    const { data } = await supabase
      .from("kpi_mfg_raw_seed_monthly")
      .select("month, variety_id, tonnes_received")
      .eq("segment_id", segment)
      .eq("year", reportingYear)
    mfgRawSeedCells = {}
    for (const row of data ?? []) {
      const vid = row.variety_id as string
      if (!mfgRawSeedCells[vid]) mfgRawSeedCells[vid] = {}
      mfgRawSeedCells[vid][row.month as number] = Number(row.tonnes_received)
    }
  }

  if (segment === "operations-manufacturing" && metricId === "mfg-processed-output") {
    const { data } = await supabase
      .from("kpi_mfg_processed_output_monthly")
      .select("month, variety_id, tonnes_processed")
      .eq("segment_id", segment)
      .eq("year", reportingYear)
    mfgProcessedCells = {}
    for (const row of data ?? []) {
      const vid = row.variety_id as string
      if (!mfgProcessedCells[vid]) mfgProcessedCells[vid] = {}
      mfgProcessedCells[vid][row.month as number] = Number(row.tonnes_processed)
    }
  }

  if (segment === "operations-manufacturing" && metricId === "mfg-packaged") {
    const { data } = await supabase
      .from("kpi_mfg_packaged_seed_monthly")
      .select("month, variety_id, tonnes_packaged")
      .eq("segment_id", segment)
      .eq("year", reportingYear)
    mfgPackagedCells = {}
    for (const row of data ?? []) {
      const vid = row.variety_id as string
      if (!mfgPackagedCells[vid]) mfgPackagedCells[vid] = {}
      mfgPackagedCells[vid][row.month as number] = Number(row.tonnes_packaged)
    }
  }

  if (segment === "operations-manufacturing" && metricId === "mfg-finished-warehouse") {
    const { data } = await supabase
      .from("kpi_mfg_finished_product_warehouse_monthly")
      .select("month, variety_id, tonnes_in_warehouse")
      .eq("segment_id", segment)
      .eq("year", reportingYear)
    mfgFinishedWarehouseCells = {}
    for (const row of data ?? []) {
      const vid = row.variety_id as string
      if (!mfgFinishedWarehouseCells[vid]) mfgFinishedWarehouseCells[vid] = {}
      mfgFinishedWarehouseCells[vid][row.month as number] = Number(row.tonnes_in_warehouse)
    }
  }

  if (segment === "operations-manufacturing" && metricId === "mfg-dispatch") {
    const { data } = await supabase
      .from("kpi_mfg_dispatch_volume_monthly")
      .select("month, variety_id, tonnes_dispatched")
      .eq("segment_id", segment)
      .eq("year", reportingYear)
    mfgDispatchCells = {}
    for (const row of data ?? []) {
      const vid = row.variety_id as string
      if (!mfgDispatchCells[vid]) mfgDispatchCells[vid] = {}
      mfgDispatchCells[vid][row.month as number] = Number(row.tonnes_dispatched)
    }
  }

  if (segment === "operations-manufacturing" && metricId === "mfg-cost-per-tonne") {
    mfgCostPerTonneByVariety = {}
    const { data } = await supabase
      .from("kpi_mfg_cost_per_tonne_by_variety")
      .select("variety_id, cost_usd_per_tonne, target_usd_per_tonne")
      .eq("segment_id", segment)
    for (const row of data ?? []) {
      const r = row as {
        variety_id: string
        cost_usd_per_tonne: number
        target_usd_per_tonne?: number
      }
      mfgCostPerTonneByVariety[r.variety_id] = {
        cost: Number(r.cost_usd_per_tonne),
        target: Number(r.target_usd_per_tonne ?? 0),
      }
    }
  }

  if (segment === "operations-manufacturing" && metricId === "mfg-efficiency") {
    mfgProcessingEfficiencyByVariety = {}
    const { data } = await supabase
      .from("kpi_mfg_processing_efficiency_by_variety")
      .select("variety_id, efficiency_percent, target_percent")
      .eq("segment_id", segment)
    for (const row of data ?? []) {
      const r = row as {
        variety_id: string
        efficiency_percent: number
        target_percent?: number
      }
      mfgProcessingEfficiencyByVariety[r.variety_id] = {
        actual: Number(r.efficiency_percent),
        target: Number(r.target_percent ?? 0),
      }
    }
  }

  if (segment === "finance" && metricId === "fin-inventory-levels") {
    financeInventoryByVariety = {}
    const { data } = await supabase
      .from("kpi_finance_inventory_by_variety")
      .select("variety_id, inventory_tonnes")
      .eq("segment_id", segment)
    for (const row of data ?? []) {
      financeInventoryByVariety[row.variety_id as string] = Number(row.inventory_tonnes)
    }
  }

  if (segment === "finance" && metricId === "fin-profitability") {
    financeProfitabilityByVariety = {}
    const { data } = await supabase
      .from("kpi_finance_profitability_by_variety")
      .select("variety_id, profitability_percent")
      .eq("segment_id", segment)
    for (const row of data ?? []) {
      financeProfitabilityByVariety[row.variety_id as string] = Number(row.profitability_percent)
    }
  }

  if (segment === "hr" && metricId === "hr-headcount") {
    const { data } = await supabase
      .from("kpi_hr_headcount_by_department")
      .select("department_key, headcount")
      .eq("segment_id", segment)
    if (data != null && data.length > 0) {
      hrHeadcountByDepartment = hrHeadcountRowsToRecord(data as HrHeadcountDbRow[])
    } else {
      hrHeadcountByDepartment = { ...DEFAULT_HR_HEADCOUNT_BY_DEPT }
    }
  }

  return (
    <KpiMetricDetail
      segmentId={segment}
      metricId={metricId}
      reportingYear={
        segment === "sales-marketing" &&
        (metricId === "sales-revenue" || metricId === "sales-volume-variety")
          ? reportingYear
          : segment === "operations-manufacturing" &&
              (metricId === "mfg-raw-received" ||
                metricId === "mfg-processed-output" ||
                metricId === "mfg-packaged" ||
                metricId === "mfg-finished-warehouse" ||
                metricId === "mfg-dispatch")
            ? reportingYear
            : undefined
      }
      salesRevenueByMonth={salesRevenueByMonth}
      salesVolumeCells={salesVolumeCells}
      mfgRawSeedCells={mfgRawSeedCells}
      mfgProcessedCells={mfgProcessedCells}
      mfgPackagedCells={mfgPackagedCells}
      mfgFinishedWarehouseCells={mfgFinishedWarehouseCells}
      mfgTonnesTargetsByVariety={mfgTonnesTargetsByVariety}
      mfgDispatchCells={mfgDispatchCells}
      mfgCostPerTonneByVariety={mfgCostPerTonneByVariety}
      mfgProcessingEfficiencyByVariety={mfgProcessingEfficiencyByVariety}
      financeInventoryByVariety={financeInventoryByVariety}
      financeProfitabilityByVariety={financeProfitabilityByVariety}
      agronomyByVariety={agronomyByVariety}
      hrHeadcountByDepartment={hrHeadcountByDepartment}
    />
  )
}
