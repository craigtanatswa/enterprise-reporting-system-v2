import type { Department } from "./permissions"

// Seed varieties for the factory module
export const SEED_VARIETIES = {
  MAIZE: ["ZS263", "ZS265A", "ZS269", "ZS248A", "OPV ZM 521"],
  WHEAT: ["NCEMA"],
  GROUNDNUTS: ["Ilanda"],
  SORGHUM: ["Macia", "SV2/SV4"],
  COWPEAS: ["CBC1", "CBC2"],
  SUNFLOWER: ["Peredovic", "Msasa"],
  SOYABEANS: ["Bimha", "Mhofu"],
  SUGARBEANS: ["NUA45", "Gloria"],
}

export const PACKAGING_SIZES = ["5kg", "10kg", "20kg", "50kg"]

export const ACTIVITY_TYPES = [
  { value: "raw_seed_received", label: "Raw Seed Received" },
  { value: "seed_processed", label: "Seed Processed" },
  { value: "seed_packaged", label: "Seed Packaged" },
  { value: "seed_dispatched", label: "Seed Dispatched" },
]

export function getDepartmentDashboardUrl(department: Department | null, subdepartment?: string | null): string {
  // Factory is special - goes to operational dashboard first
  if (subdepartment === "FACTORY") {
    return "/dashboard/departments/factory"
  }
  
  // All other departments go to Documents as primary
  if (subdepartment === "AGRONOMY") {
    return "/dashboard/departments/agronomy/documents"
  }

  // Regular departments - Documents is primary landing page
  const departmentMap: Record<Department, string> = {
    AUDIT: "/dashboard/departments/audit/documents",
    OPERATIONS: "/dashboard",
    FINANCE: "/dashboard/departments/finance/documents",
    MARKETING_AND_SALES: "/dashboard/departments/marketing/documents",
    LEGAL_AND_COMPLIANCE: "/dashboard/departments/legal/documents",
    HUMAN_RESOURCES_AND_ADMINISTRATION: "/dashboard/departments/hr/documents",
    PROPERTIES_MANAGEMENT: "/dashboard/departments/properties/documents",
    ICT_AND_DIGITAL_TRANSFORMATION: "/dashboard/departments/ict/documents",
    PROCUREMENT: "/dashboard/departments/procurement/documents",
    PUBLIC_RELATIONS: "/dashboard/departments/public-relations/documents",
  }

  return department ? departmentMap[department] || "/dashboard" : "/dashboard"
}

export function getDepartmentSpecificNavigation(department: Department | null, subdepartment?: string | null) {
  // Factory has operational dashboard first, then documents
  const factoryNavigation = [
    { icon: "Factory", label: "Factory Dashboard", href: "/dashboard/departments/factory" },
    { icon: "FileText", label: "Documents", href: "/dashboard/departments/factory/documents" },
    { icon: "Archive", label: "Archive / History", href: "/dashboard/departments/factory/archive" },
    { icon: "BookOpen", label: "Guidelines", href: "/dashboard/departments/factory/guidelines" },
  ]

  // All other departments: Documents first (primary), then dashboard (secondary)
  const standardNavigation: Record<string, Array<{ icon: string; label: string; href: string }>> = {
    FINANCE: [
      { icon: "FileText", label: "Documents", href: "/dashboard/departments/finance/documents" },
      { icon: "LayoutDashboard", label: "Dashboard", href: "/dashboard/departments/finance/dashboard" },
      { icon: "Archive", label: "Archive / History", href: "/dashboard/departments/finance/archive" },
      { icon: "BookOpen", label: "Guidelines", href: "/dashboard/departments/finance/guidelines" },
    ],
    MARKETING_AND_SALES: [
      { icon: "FileText", label: "Documents", href: "/dashboard/departments/marketing/documents" },
      { icon: "LayoutDashboard", label: "Dashboard", href: "/dashboard/departments/marketing/dashboard" },
      { icon: "Archive", label: "Archive / History", href: "/dashboard/departments/marketing/archive" },
      { icon: "BookOpen", label: "Guidelines", href: "/dashboard/departments/marketing/guidelines" },
    ],
    HUMAN_RESOURCES_AND_ADMINISTRATION: [
      { icon: "FileText", label: "Documents", href: "/dashboard/departments/hr/documents" },
      { icon: "LayoutDashboard", label: "Dashboard", href: "/dashboard/departments/hr/dashboard" },
      { icon: "Archive", label: "Archive / History", href: "/dashboard/departments/hr/archive" },
      { icon: "BookOpen", label: "Guidelines", href: "/dashboard/departments/hr/guidelines" },
    ],
    LEGAL_AND_COMPLIANCE: [
      { icon: "FileText", label: "Documents", href: "/dashboard/departments/legal/documents" },
      { icon: "LayoutDashboard", label: "Dashboard", href: "/dashboard/departments/legal/dashboard" },
      { icon: "Archive", label: "Archive / History", href: "/dashboard/departments/legal/archive" },
      { icon: "BookOpen", label: "Guidelines", href: "/dashboard/departments/legal/guidelines" },
    ],
    ICT_AND_DIGITAL_TRANSFORMATION: [
      { icon: "FileText", label: "Documents", href: "/dashboard/departments/ict/documents" },
      { icon: "LayoutDashboard", label: "Dashboard", href: "/dashboard/departments/ict/dashboard" },
      { icon: "Archive", label: "Archive / History", href: "/dashboard/departments/ict/archive" },
      { icon: "BookOpen", label: "Guidelines", href: "/dashboard/departments/ict/guidelines" },
    ],
    PROCUREMENT: [
      { icon: "FileText", label: "Documents", href: "/dashboard/departments/procurement/documents" },
      { icon: "LayoutDashboard", label: "Dashboard", href: "/dashboard/departments/procurement/dashboard" },
      { icon: "Archive", label: "Archive / History", href: "/dashboard/departments/procurement/archive" },
      { icon: "BookOpen", label: "Guidelines", href: "/dashboard/departments/procurement/guidelines" },
    ],
    PROPERTIES_MANAGEMENT: [
      { icon: "FileText", label: "Documents", href: "/dashboard/departments/properties/documents" },
      { icon: "LayoutDashboard", label: "Dashboard", href: "/dashboard/departments/properties/dashboard" },
      { icon: "Archive", label: "Archive / History", href: "/dashboard/departments/properties/archive" },
      { icon: "BookOpen", label: "Guidelines", href: "/dashboard/departments/properties/guidelines" },
    ],
    PUBLIC_RELATIONS: [
      { icon: "FileText", label: "Documents", href: "/dashboard/departments/public-relations/documents" },
      { icon: "LayoutDashboard", label: "Dashboard", href: "/dashboard/departments/public-relations/dashboard" },
      { icon: "Archive", label: "Archive / History", href: "/dashboard/departments/public-relations/archive" },
      { icon: "BookOpen", label: "Guidelines", href: "/dashboard/departments/public-relations/guidelines" },
    ],
    AUDIT: [
      { icon: "FileText", label: "Documents", href: "/dashboard/departments/audit/documents" },
      { icon: "LayoutDashboard", label: "Dashboard", href: "/dashboard/departments/audit/dashboard" },
      { icon: "Archive", label: "Archive / History", href: "/dashboard/departments/audit/archive" },
      { icon: "BookOpen", label: "Guidelines", href: "/dashboard/departments/audit/guidelines" },
    ],
    AGRONOMY: [
      { icon: "FileText", label: "Documents", href: "/dashboard/departments/agronomy/documents" },
      { icon: "LayoutDashboard", label: "Dashboard", href: "/dashboard/departments/agronomy/dashboard" },
      { icon: "Archive", label: "Archive / History", href: "/dashboard/departments/agronomy/archive" },
      { icon: "BookOpen", label: "Guidelines", href: "/dashboard/departments/agronomy/guidelines" },
    ],
  }

  if (subdepartment === "FACTORY") {
    return factoryNavigation
  }
  if (subdepartment === "AGRONOMY") {
    return standardNavigation.AGRONOMY || []
  }

  return department ? standardNavigation[department] || [] : []
}

// Document categories for all departments
export const DOCUMENT_CATEGORIES = [
  { value: "weekly_report", label: "Weekly Report" },
  { value: "quarterly_report", label: "Quarterly Report" },
  { value: "balance_scorecard", label: "Balance Scorecard" },
]

// Document statuses
export const DOCUMENT_STATUSES = [
  { value: "draft", label: "Draft", color: "secondary" },
  { value: "submitted", label: "Submitted", color: "default" },
  { value: "returned_with_comments", label: "Returned with Comments", color: "destructive" },
  { value: "reviewed_no_comments", label: "Reviewed - No Comments", color: "outline" },
  { value: "approved", label: "Approved", color: "default" },
]
