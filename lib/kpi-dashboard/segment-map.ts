import type { Department, SubDepartment } from "@/lib/utils/permissions"
import type { UserRole } from "@/lib/utils/permissions"

/** KPI segment ids aligned with `initialDepartments` in `initial-data.ts` */
export type KpiSegmentId =
  | "executive"
  | "operations-agronomy"
  | "operations-manufacturing"
  | "sales-marketing"
  | "finance"
  | "hr"
  | "procurement"
  | "ict"
  | "inventory"
  | "audit-compliance"

export function getKpiSegmentForProfile(
  department: Department | null,
  subdepartment: SubDepartment | string | null
): KpiSegmentId | null {
  if (!department) return null
  if (department === "OPERATIONS" && subdepartment === "AGRONOMY") return "operations-agronomy"
  if (department === "OPERATIONS" && subdepartment === "FACTORY") return "operations-manufacturing"
  if (department === "FINANCE") return "finance"
  if (department === "MARKETING_AND_SALES") return "sales-marketing"
  if (department === "HUMAN_RESOURCES_AND_ADMINISTRATION") return "hr"
  if (department === "PROCUREMENT") return "procurement"
  if (department === "ICT_AND_DIGITAL_TRANSFORMATION") return "ict"
  if (department === "AUDIT") return "audit-compliance"
  return null
}

export function canViewAllKpiSegments(role: UserRole): boolean {
  return (
    role === "MANAGING_DIRECTOR" ||
    role === "BOOTSTRAP_ADMIN" ||
    role === "ADMIN" ||
    role === "GENERAL_MANAGER" ||
    role === "CORPORATE_SERVICES_MANAGER"
  )
}

export function canUpdateDepartmentKpi(role: UserRole): boolean {
  return (
    role === "HEAD_OF_DEPARTMENT" ||
    role === "STAFF" ||
    role === "BOOTSTRAP_ADMIN" ||
    role === "ADMIN"
  )
}

export function canPostMdKpiComments(role: UserRole): boolean {
  return role === "MANAGING_DIRECTOR" || role === "BOOTSTRAP_ADMIN"
}

export function userMayAccessSegment(
  role: UserRole,
  department: Department | null,
  subdepartment: SubDepartment | string | null,
  segmentId: string
): boolean {
  if (segmentId === "executive") {
    return canViewAllKpiSegments(role)
  }
  if (canViewAllKpiSegments(role)) return true
  const mine = getKpiSegmentForProfile(department, subdepartment)
  return mine === segmentId
}

export function userMayUpdateSegment(
  role: UserRole,
  department: Department | null,
  subdepartment: SubDepartment | string | null,
  segmentId: string
): boolean {
  if (segmentId === "executive") return false
  if (role === "BOOTSTRAP_ADMIN" || role === "ADMIN") return true
  if (!canUpdateDepartmentKpi(role)) return false
  const mine = getKpiSegmentForProfile(department, subdepartment)
  return mine === segmentId
}
