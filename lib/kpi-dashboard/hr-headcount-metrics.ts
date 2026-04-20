import {
  HR_HEADCOUNT_DEPARTMENTS,
  isHrHeadcountDepartmentKey,
  type HrHeadcountDepartmentKey,
} from "@/lib/kpi-dashboard/hr-headcount-departments"

export type HrHeadcountDbRow = {
  department_key: string
  headcount: number
  updated_at?: string
}

export function deriveHrHeadcountFromDbRows(rows: HrHeadcountDbRow[]) {
  const byKey = new Map<string, number>()
  let lastUpdated = ""
  for (const r of rows) {
    const k = String(r.department_key)
    const n = Number(r.headcount)
    if (!Number.isNaN(n) && n >= 0) {
      byKey.set(k, n)
    }
    const ts = r.updated_at != null ? String(r.updated_at) : ""
    if (ts > lastUpdated) lastUpdated = ts
  }

  let total = 0
  const breakdown: { label: string; value: number }[] = []
  for (const d of HR_HEADCOUNT_DEPARTMENTS) {
    const v = byKey.get(d.key) ?? 0
    total += v
    breakdown.push({ label: d.label, value: v })
  }

  return {
    total,
    breakdown,
    lastUpdated: lastUpdated || new Date().toISOString(),
    details:
      "Total headcount is the sum of reported employees by department. Update figures in the table below.",
  }
}

export function hrHeadcountRowsToRecord(rows: HrHeadcountDbRow[]): Record<HrHeadcountDepartmentKey, number> {
  const out = Object.fromEntries(HR_HEADCOUNT_DEPARTMENTS.map((d) => [d.key, 0])) as Record<
    HrHeadcountDepartmentKey,
    number
  >
  for (const r of rows) {
    const k = String(r.department_key)
    if (!isHrHeadcountDepartmentKey(k)) continue
    const n = Number(r.headcount)
    if (!Number.isNaN(n) && n >= 0) out[k] = n
  }
  return out
}
