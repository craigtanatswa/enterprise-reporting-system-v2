export type UserRole =
  | "BOOTSTRAP_ADMIN"
  | "ADMIN"
  | "MANAGING_DIRECTOR"
  | "AUDITOR"
  | "EXECUTIVE" // Deprecated - use GM or CSM; retained for migration
  | "GENERAL_MANAGER"
  | "CORPORATE_SERVICES_MANAGER"
  | "HEAD_OF_DEPARTMENT"
  | "STAFF"

export type Department =
  | "AUDIT"
  | "OPERATIONS"
  | "FINANCE"
  | "MARKETING_AND_SALES"
  | "LEGAL_AND_COMPLIANCE"
  | "HUMAN_RESOURCES_AND_ADMINISTRATION"
  | "PROPERTIES_MANAGEMENT"
  | "ICT_AND_DIGITAL_TRANSFORMATION"
  | "PROCUREMENT"
  | "PUBLIC_RELATIONS"
  | "OFFICE_OF_THE_MANAGING_DIRECTOR"
  | "OFFICE_OF_CORPORATE_SERVICES"

export type SubDepartment = "AGRONOMY" | "FACTORY"

export const ROLE_PERMISSIONS = {
  BOOTSTRAP_ADMIN: {
    viewAll: true,
    manageUsers: true,
    createAdmin: true,
    promoteToAdmin: true,
    approveDocuments: true,
    accessAllDepartments: true,
    exportReports: true,
    viewAuditLogs: true,
    systemConfiguration: true,
    viewConfidentialAuditReports: true,
    approveAccounts: true,
  },
  ADMIN: {
    viewAll: true,
    manageUsers: true,
    createAdmin: true,
    promoteToAdmin: true,
    approveDocuments: true,
    accessAllDepartments: true,
    exportReports: true,
    viewAuditLogs: true,
    systemConfiguration: true,
    viewConfidentialAuditReports: false,
    approveAccounts: true,
  },
  MANAGING_DIRECTOR: {
    viewAll: true,
    manageUsers: false,
    createAdmin: false,
    promoteToAdmin: false,
    approveDocuments: true,
    accessAllDepartments: true,
    exportReports: true,
    viewAuditLogs: true,
    systemConfiguration: false,
    viewConfidentialAuditReports: true,
    approveAccounts: false,
  },
  AUDITOR: {
    viewAll: true,
    manageUsers: false,
    createAdmin: false,
    promoteToAdmin: false,
    approveDocuments: false,
    accessAllDepartments: true,
    exportReports: true,
    viewAuditLogs: true,
    systemConfiguration: false,
    viewConfidentialAuditReports: false,
    approveAccounts: false,
    uploadConfidentialReports: true,
    editOperationalReports: false,
  },
  EXECUTIVE: {
    viewAll: true,
    manageUsers: false,
    createAdmin: false,
    promoteToAdmin: false,
    approveDocuments: true,
    accessAllDepartments: true,
    exportReports: true,
    viewAuditLogs: false,
    systemConfiguration: false,
    viewConfidentialAuditReports: false,
    approveAccounts: false,
  },
  GENERAL_MANAGER: {
    viewAll: false,
    manageUsers: false,
    createAdmin: false,
    promoteToAdmin: false,
    approveDocuments: true,
    accessAllDepartments: false,
    exportReports: true,
    viewAuditLogs: false,
    systemConfiguration: false,
    viewConfidentialAuditReports: false,
    approveAccounts: false,
  },
  CORPORATE_SERVICES_MANAGER: {
    viewAll: false,
    manageUsers: false,
    createAdmin: false,
    promoteToAdmin: false,
    approveDocuments: true,
    accessAllDepartments: false,
    exportReports: true,
    viewAuditLogs: false,
    systemConfiguration: false,
    viewConfidentialAuditReports: false,
    approveAccounts: false,
  },
  HEAD_OF_DEPARTMENT: {
    viewAll: false,
    manageUsers: false,
    createAdmin: false,
    promoteToAdmin: false,
    approveDocuments: true,
    accessAllDepartments: false,
    exportReports: true,
    viewAuditLogs: false,
    systemConfiguration: false,
    viewConfidentialAuditReports: false,
    approveAccounts: false,
  },
  STAFF: {
    viewAll: false,
    manageUsers: false,
    createAdmin: false,
    promoteToAdmin: false,
    approveDocuments: false,
    accessAllDepartments: false,
    exportReports: false,
    viewAuditLogs: false,
    systemConfiguration: false,
    viewConfidentialAuditReports: false,
    approveAccounts: false,
  },
} as const

export function hasPermission(role: UserRole, permission: keyof (typeof ROLE_PERMISSIONS)["ADMIN"]): boolean {
  return ROLE_PERMISSIONS[role]?.[permission] ?? false
}

export function getRoleLabel(role: UserRole): string {
  const labels: Record<UserRole, string> = {
    BOOTSTRAP_ADMIN: "Bootstrap Admin",
    ADMIN: "Administrator",
    MANAGING_DIRECTOR: "Managing Director",
    AUDITOR: "Auditor",
    EXECUTIVE: "Executive (Deprecated)",
    GENERAL_MANAGER: "General Manager",
    CORPORATE_SERVICES_MANAGER: "Corporate Services Manager",
    HEAD_OF_DEPARTMENT: "Head of Department",
    STAFF: "Staff",
  }
  return labels[role] || role
}

export function getDepartmentLabel(department: Department): string {
  const labels: Record<Department, string> = {
    AUDIT: "Audit",
    OPERATIONS: "Operations",
    FINANCE: "Finance",
    MARKETING_AND_SALES: "Marketing and Sales",
    LEGAL_AND_COMPLIANCE: "Legal & Compliance",
    HUMAN_RESOURCES_AND_ADMINISTRATION: "Human Resources & Administration",
    PROPERTIES_MANAGEMENT: "Properties Management",
    ICT_AND_DIGITAL_TRANSFORMATION: "ICT & Digital Transformation",
    PROCUREMENT: "Procurement",
    PUBLIC_RELATIONS: "Public Relations",
    OFFICE_OF_THE_MANAGING_DIRECTOR: "The Office of the Managing Director",
    OFFICE_OF_CORPORATE_SERVICES: "Office of Corporate Services",
  }
  return labels[department] || department
}

export function getSubDepartmentLabel(subDepartment: SubDepartment): string {
  const labels: Record<SubDepartment, string> = {
    AGRONOMY: "Agronomy",
    FACTORY: "Factory",
  }
  return labels[subDepartment] || subDepartment
}

export function isAdmin(role: UserRole): boolean {
  return role === "ADMIN" || role === "BOOTSTRAP_ADMIN"
}

export function canManageUsers(role: UserRole): boolean {
  return hasPermission(role, "manageUsers")
}

export function canCreateAdmin(role: UserRole): boolean {
  return hasPermission(role, "createAdmin")
}

export function canAccessAuditFeatures(role: UserRole): boolean {
  return role === "AUDITOR" || hasPermission(role, "viewAuditLogs")
}

export function canViewConfidentialReports(role: UserRole): boolean {
  return hasPermission(role, "viewConfidentialAuditReports")
}

/**
 * Gate for /dashboard/md and all nested routes.
 * Only MANAGING_DIRECTOR may enter; BOOTSTRAP_ADMIN included for
 * initial system setup only.
 */
export function canViewMDDashboard(role: UserRole): boolean {
  return role === "MANAGING_DIRECTOR" || role === "BOOTSTRAP_ADMIN"
}

export function canUploadConfidentialReports(role: UserRole): boolean {
  return role === "AUDITOR"
}

export function isAuditor(role: UserRole): boolean {
  return role === "AUDITOR"
}

export function isManagingDirector(role: UserRole): boolean {
  return role === "MANAGING_DIRECTOR"
}

export function canApproveAccounts(role: UserRole): boolean {
  return hasPermission(role, "approveAccounts")
}

/** Single-holder roles: only one user per system */
export const SINGLE_HOLDER_ROLES: UserRole[] = ["GENERAL_MANAGER", "CORPORATE_SERVICES_MANAGER"]

export function isGeneralManager(role: UserRole): boolean {
  return role === "GENERAL_MANAGER"
}

export function isCorporateServicesManager(role: UserRole): boolean {
  return role === "CORPORATE_SERVICES_MANAGER"
}