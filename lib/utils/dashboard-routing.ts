import type { Department } from "./permissions"
import { getKpiSegmentForProfile } from "@/lib/kpi-dashboard/segment-map"

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

export function getDepartmentDashboardUrl(
  department: Department | null,
  subdepartment?: string | null,
  role?: string
): string {
  // General Manager — lands on GM dashboard (Operations reports)
  if (role === "GENERAL_MANAGER") {
    return "/dashboard/gm"
  }

  // Corporate Services Manager — lands on CSM dashboard
  if (role === "CORPORATE_SERVICES_MANAGER") {
    return "/dashboard/csm"
  }

  // Managing Director — default landing: Executive Overview (MD KPI dashboard)
  if (department === "OFFICE_OF_THE_MANAGING_DIRECTOR") {
    return "/dashboard/md/kpi"
  }

  // Factory is special - operational console first
  if (subdepartment === "FACTORY") {
    return "/dashboard/departments/factory"
  }

  if (subdepartment === "AGRONOMY") {
    return "/dashboard/kpi"
  }

  const kpiSegment = getKpiSegmentForProfile(department, subdepartment)
  if (kpiSegment) {
    return "/dashboard/kpi"
  }

  // Regular departments — documents-first when no KPI segment is configured
  const departmentMap: Record<Department, string> = {
    OFFICE_OF_THE_MANAGING_DIRECTOR: "/dashboard/md",
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
  // Managing Director — Executive Overview primary; Submitted Reports; MD Dashboard for confidential audit reports
  const mdNavigation = [
    { icon: "LayoutDashboard", label: "Executive overview", href: "/dashboard/md/kpi" },
    { icon: "Eye", label: "Submitted Reports", href: "/dashboard/md/reports" },
    { icon: "Crown", label: "MD Dashboard", href: "/dashboard/md" },
    { icon: "CheckCircle2", label: "Acknowledgements", href: "/dashboard/md/acknowledgements" },
  ]

  // Factory: same order as all departments: Dashboard, Documents (primary), Archive, Guidelines
  const factoryNavigation = [
    { icon: "LayoutDashboard", label: "KPI Dashboard", href: "/dashboard/kpi" },
    { icon: "Factory", label: "Factory Operations", href: "/dashboard/departments/factory" },
    { icon: "FileText", label: "Documents", href: "/dashboard/departments/factory/documents" },
    { icon: "Archive", label: "Archive / History", href: "/dashboard/departments/factory/archive" },
    { icon: "BookOpen", label: "Guidelines", href: "/dashboard/departments/factory/guidelines" },
  ]

  // All departments: exact order per spec: 1. Dashboard, 2. Documents (DEFAULT & PRIMARY), 3. Archive, 4. Guidelines
  const standardNavigation: Record<string, Array<{ icon: string; label: string; href: string }>> = {
    FINANCE: [
      { icon: "LayoutDashboard", label: "KPI Dashboard", href: "/dashboard/kpi" },
      { icon: "FileText", label: "Documents", href: "/dashboard/departments/finance/documents" },
      { icon: "Archive", label: "Archive / History", href: "/dashboard/departments/finance/archive" },
      { icon: "BookOpen", label: "Guidelines", href: "/dashboard/departments/finance/guidelines" },
    ],
    MARKETING_AND_SALES: [
      { icon: "LayoutDashboard", label: "KPI Dashboard", href: "/dashboard/kpi" },
      { icon: "FileText", label: "Documents", href: "/dashboard/departments/marketing/documents" },
      { icon: "Archive", label: "Archive / History", href: "/dashboard/departments/marketing/archive" },
      { icon: "BookOpen", label: "Guidelines", href: "/dashboard/departments/marketing/guidelines" },
    ],
    HUMAN_RESOURCES_AND_ADMINISTRATION: [
      { icon: "LayoutDashboard", label: "KPI Dashboard", href: "/dashboard/kpi" },
      { icon: "FileText", label: "Documents", href: "/dashboard/departments/hr/documents" },
      { icon: "Archive", label: "Archive / History", href: "/dashboard/departments/hr/archive" },
      { icon: "BookOpen", label: "Guidelines", href: "/dashboard/departments/hr/guidelines" },
    ],
    LEGAL_AND_COMPLIANCE: [
      { icon: "LayoutDashboard", label: "Dashboard", href: "/dashboard/departments/legal/dashboard" },
      { icon: "FileText", label: "Documents", href: "/dashboard/departments/legal/documents" },
      { icon: "Archive", label: "Archive / History", href: "/dashboard/departments/legal/archive" },
      { icon: "BookOpen", label: "Guidelines", href: "/dashboard/departments/legal/guidelines" },
    ],
    ICT_AND_DIGITAL_TRANSFORMATION: [
      { icon: "LayoutDashboard", label: "KPI Dashboard", href: "/dashboard/kpi" },
      { icon: "FileText", label: "Documents", href: "/dashboard/departments/ict/documents" },
      { icon: "Archive", label: "Archive / History", href: "/dashboard/departments/ict/archive" },
      { icon: "BookOpen", label: "Guidelines", href: "/dashboard/departments/ict/guidelines" },
    ],
    PROCUREMENT: [
      { icon: "LayoutDashboard", label: "KPI Dashboard", href: "/dashboard/kpi" },
      { icon: "FileText", label: "Documents", href: "/dashboard/departments/procurement/documents" },
      { icon: "Archive", label: "Archive / History", href: "/dashboard/departments/procurement/archive" },
      { icon: "BookOpen", label: "Guidelines", href: "/dashboard/departments/procurement/guidelines" },
    ],
    PROPERTIES_MANAGEMENT: [
      { icon: "LayoutDashboard", label: "Dashboard", href: "/dashboard/departments/properties/dashboard" },
      { icon: "FileText", label: "Documents", href: "/dashboard/departments/properties/documents" },
      { icon: "Archive", label: "Archive / History", href: "/dashboard/departments/properties/archive" },
      { icon: "BookOpen", label: "Guidelines", href: "/dashboard/departments/properties/guidelines" },
    ],
    PUBLIC_RELATIONS: [
      { icon: "LayoutDashboard", label: "Dashboard", href: "/dashboard/departments/public-relations/dashboard" },
      { icon: "FileText", label: "Documents", href: "/dashboard/departments/public-relations/documents" },
      { icon: "Archive", label: "Archive / History", href: "/dashboard/departments/public-relations/archive" },
      { icon: "BookOpen", label: "Guidelines", href: "/dashboard/departments/public-relations/guidelines" },
    ],
    AUDIT: [
      { icon: "LayoutDashboard", label: "KPI Dashboard", href: "/dashboard/kpi" },
      { icon: "FileText", label: "Documents", href: "/dashboard/departments/audit/documents" },
      { icon: "Archive", label: "Archive / History", href: "/dashboard/departments/audit/archive" },
      { icon: "BookOpen", label: "Guidelines", href: "/dashboard/departments/audit/guidelines" },
    ],
    AGRONOMY: [
      { icon: "LayoutDashboard", label: "KPI Dashboard", href: "/dashboard/kpi" },
      { icon: "FileText", label: "Documents", href: "/dashboard/departments/agronomy/documents" },
      { icon: "Archive", label: "Archive / History", href: "/dashboard/departments/agronomy/archive" },
      { icon: "BookOpen", label: "Guidelines", href: "/dashboard/departments/agronomy/guidelines" },
    ],
    OPERATIONS: [
      { icon: "LayoutDashboard", label: "KPI Dashboard", href: "/dashboard/kpi" },
      { icon: "Factory", label: "Factory Operations", href: "/dashboard/departments/factory" },
      { icon: "FileText", label: "Documents", href: "/dashboard/departments/factory/documents" },
      { icon: "Archive", label: "Archive / History", href: "/dashboard/departments/factory/archive" },
      { icon: "BookOpen", label: "Guidelines", href: "/dashboard/departments/factory/guidelines" },
    ],
  }

  if (department === "OFFICE_OF_THE_MANAGING_DIRECTOR") {
    return mdNavigation
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