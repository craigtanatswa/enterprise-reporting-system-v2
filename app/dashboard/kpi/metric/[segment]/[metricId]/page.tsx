import { KpiMetricDetail } from "@/components/kpi-dashboard/kpi-metric-detail"
import { createClient } from "@/lib/supabase/server"
import { userMayAccessSegment } from "@/lib/kpi-dashboard/segment-map"
import {
  isAgronomyVarietyTableMetric,
  normalizeAgronomyVarietyRow,
  type AgronomyVarietyData,
  type AgronomyVarietyDbRow,
} from "@/lib/kpi-dashboard/agronomy-metrics"
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
  let financeInventoryByVariety: Record<string, number> | undefined
  let agronomyByVariety: Record<string, AgronomyVarietyData> | undefined

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

  return (
    <KpiMetricDetail
      segmentId={segment}
      metricId={metricId}
      reportingYear={
        segment === "sales-marketing" &&
        (metricId === "sales-revenue" || metricId === "sales-volume-variety")
          ? reportingYear
          : segment === "operations-manufacturing" && metricId === "mfg-raw-received"
            ? reportingYear
            : undefined
      }
      salesRevenueByMonth={salesRevenueByMonth}
      salesVolumeCells={salesVolumeCells}
      mfgRawSeedCells={mfgRawSeedCells}
      financeInventoryByVariety={financeInventoryByVariety}
      agronomyByVariety={agronomyByVariety}
    />
  )
}
