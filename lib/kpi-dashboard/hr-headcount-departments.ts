/** Organizational units used for HR total headcount breakdown (stable DB keys). */
export const HR_HEADCOUNT_DEPARTMENTS = [
  { key: "executive", label: "Executive" },
  { key: "operations-agronomy", label: "Agronomy" },
  { key: "operations-manufacturing", label: "Manufacturing" },
  { key: "sales-marketing", label: "Sales & Marketing" },
  { key: "finance", label: "Finance" },
  { key: "hr", label: "Human Resources" },
  { key: "procurement", label: "Procurement" },
  { key: "ict", label: "ICT" },
  { key: "inventory", label: "Inventory" },
  { key: "audit-compliance", label: "Audit & Compliance" },
  { key: "legal-compliance", label: "Legal & Compliance" },
] as const

export type HrHeadcountDepartmentKey = (typeof HR_HEADCOUNT_DEPARTMENTS)[number]["key"]

const keys = HR_HEADCOUNT_DEPARTMENTS.map((d) => d.key) as readonly HrHeadcountDepartmentKey[]

export function isHrHeadcountDepartmentKey(k: string): k is HrHeadcountDepartmentKey {
  return (keys as readonly string[]).includes(k)
}

/** Default seed counts (sum = total company headcount). */
export const DEFAULT_HR_HEADCOUNT_BY_DEPT: Record<HrHeadcountDepartmentKey, number> = {
  executive: 8,
  "operations-agronomy": 42,
  "operations-manufacturing": 70,
  "sales-marketing": 28,
  finance: 15,
  hr: 12,
  procurement: 14,
  ict: 9,
  inventory: 22,
  "audit-compliance": 10,
  "legal-compliance": 15,
}

export function defaultHrHeadcountBreakdown() {
  return HR_HEADCOUNT_DEPARTMENTS.map((d) => ({
    label: d.label,
    value: DEFAULT_HR_HEADCOUNT_BY_DEPT[d.key],
  }))
}

export function defaultHrHeadcountTotal(): number {
  return HR_HEADCOUNT_DEPARTMENTS.reduce((s, d) => s + DEFAULT_HR_HEADCOUNT_BY_DEPT[d.key], 0)
}
