import { KpiMetricDetail } from "@/components/kpi-dashboard/kpi-metric-detail"
import { createClient } from "@/lib/supabase/server"
import { userMayAccessSegment } from "@/lib/kpi-dashboard/segment-map"
import type { Department, SubDepartment } from "@/lib/utils/permissions"
import type { UserRole } from "@/lib/utils/permissions"
import { redirect } from "next/navigation"

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

  return (
    <KpiMetricDetail
      segmentId={segment}
      metricId={metricId}
      reportingYear={
        segment === "sales-marketing" &&
        (metricId === "sales-revenue" || metricId === "sales-volume-variety")
          ? reportingYear
          : undefined
      }
      salesRevenueByMonth={salesRevenueByMonth}
      salesVolumeCells={salesVolumeCells}
    />
  )
}
