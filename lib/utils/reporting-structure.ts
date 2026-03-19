import type { Department } from "./permissions"

/**
 * Reporting structure per ARDA Seeds specification:
 * - GM supervises: Operations (including Manufacturing/FACTORY, Agronomy/AGRONOMY)
 * - CSM supervises: Marketing, Legal, HR, Properties, ICT
 * - Finance Manager supervises: Finance
 * - MD supervises directly: Procurement, Public Relations, Audit
 * - MD receives all reports from all supervisors
 */

export type SupervisorRole =
  | "GENERAL_MANAGER"
  | "CORPORATE_SERVICES_MANAGER"
  | "FINANCE_MANAGER"
  | "MANAGING_DIRECTOR"

/** Department overseen by General Manager (Operations includes Manufacturing/Factory, Agronomy) */
export const GM_DEPARTMENT: Department = "OPERATIONS"

/** Departments overseen by Corporate Services Manager */
export const CSM_DEPARTMENTS: Department[] = [
  "MARKETING_AND_SALES",
  "LEGAL_AND_COMPLIANCE",
  "HUMAN_RESOURCES_AND_ADMINISTRATION",
  "PROPERTIES_MANAGEMENT",
  "ICT_AND_DIGITAL_TRANSFORMATION",
]

/** Departments overseen by Finance Manager */
export const FINANCE_MANAGER_DEPARTMENTS: Department[] = ["FINANCE"]

/** Departments that report directly to Managing Director */
export const MD_DIRECT_DEPARTMENTS: Department[] = [
  "PROCUREMENT",
  "PUBLIC_RELATIONS",
  "AUDIT",
]

/**
 * Get the supervisor role for a given department/sub-department.
 * Used to route documents to the correct reviewer.
 */
export function getSupervisorForDepartment(
  department: Department,
  subDepartment?: string | null
): SupervisorRole {
  // Operations (including Manufacturing/Factory, Agronomy) -> GM
  if (department === "OPERATIONS" || subDepartment === "FACTORY" || subDepartment === "AGRONOMY") {
    return "GENERAL_MANAGER"
  }

  // Corporate Services departments -> CSM
  if (CSM_DEPARTMENTS.includes(department)) {
    return "CORPORATE_SERVICES_MANAGER"
  }

  // Finance -> Finance Manager
  if (department === "FINANCE") {
    return "FINANCE_MANAGER"
  }

  // Procurement, PR, Audit -> MD directly
  if (MD_DIRECT_DEPARTMENTS.includes(department)) {
    return "MANAGING_DIRECTOR"
  }

  return "MANAGING_DIRECTOR"
}

/**
 * Check if a department is supervised by GM (for GM dashboard filtering).
 * Operations includes Manufacturing (Factory) and Agronomy sub-departments.
 */
export function isGMDepartment(department: Department): boolean {
  return department === "OPERATIONS"
}

/**
 * Check if a department is supervised by CSM (for CSM dashboard filtering)
 */
export function isCSMDepartment(department: Department): boolean {
  return CSM_DEPARTMENTS.includes(department)
}
