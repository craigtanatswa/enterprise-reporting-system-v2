import type { UserRole, Department } from "./permissions"

export interface UserProfile {
  id: string
  email: string
  full_name: string
  role: UserRole
  department: Department
  sub_department: string | null
  is_active: boolean
  requires_approval: boolean
}

/**
 * Get dashboard route based on user role and department
 */
export function getDashboardRoute(profile: UserProfile): string {
  // Managing Director gets consolidated view
  if (profile.role === "MANAGING_DIRECTOR") {
    return "/dashboard/md"
  }

  // Admins get system management dashboard
  if (profile.role === "ADMIN" || profile.role === "BOOTSTRAP_ADMIN") {
    return "/dashboard/admin"
  }

  // Auditors get audit dashboard
  if (profile.role === "AUDITOR" || profile.department === "AUDIT") {
    return "/dashboard/audit"
  }

  // Department-specific routing
  switch (profile.department) {
    case "OPERATIONS":
      // Check for sub-department
      if (profile.sub_department === "AGRONOMY") {
        return "/dashboard/operations/agronomy"
      }
      if (profile.sub_department === "FACTORY") {
        return "/dashboard/operations/factory"
      }
      return "/dashboard/operations"

    case "FINANCE":
      return "/dashboard/finance"

    case "MARKETING_AND_SALES":
      return "/dashboard/marketing"

    case "LEGAL_AND_COMPLIANCE":
      return "/dashboard/legal"

    case "HUMAN_RESOURCES_AND_ADMINISTRATION":
      return "/dashboard/hr"

    case "PROPERTIES_MANAGEMENT":
      return "/dashboard/properties"

    case "ICT_AND_DIGITAL_TRANSFORMATION":
      return "/dashboard/ict"

    case "PROCUREMENT":
      return "/dashboard/procurement"

    case "PUBLIC_RELATIONS":
      return "/dashboard/public-relations"

    default:
      return "/dashboard"
  }
}

/**
 * Check if user can access a specific route
 */
export function canAccessRoute(profile: UserProfile, pathname: string): boolean {
  // Inactive users cannot access any dashboard routes
  if (!profile.is_active && pathname.startsWith("/dashboard")) {
    return false
  }

  // Managing Director can access all routes
  if (profile.role === "MANAGING_DIRECTOR") {
    return true
  }

  // Admins can access admin routes and user management
  if (profile.role === "ADMIN" || profile.role === "BOOTSTRAP_ADMIN") {
    return (
      pathname.startsWith("/dashboard/admin") ||
      pathname.startsWith("/dashboard/users") ||
      pathname.startsWith("/dashboard/profile") ||
      pathname === "/dashboard"
    )
  }

  // Auditors can access audit routes only
  if (profile.role === "AUDITOR") {
    return (
      pathname.startsWith("/dashboard/audit") || pathname.startsWith("/dashboard/profile") || pathname === "/dashboard"
    )
  }

  // Department-specific access
  const departmentRoute = getDashboardRoute(profile)

  return (
    pathname === "/dashboard" ||
    pathname === "/dashboard/profile" ||
    pathname === "/dashboard/notifications" ||
    pathname.startsWith(departmentRoute)
  )
}

/**
 * Get welcome message based on user role
 */
export function getWelcomeMessage(profile: UserProfile): string {
  const timeOfDay = new Date().getHours()
  const greeting = timeOfDay < 12 ? "Good morning" : timeOfDay < 18 ? "Good afternoon" : "Good evening"

  return `${greeting}, ${profile.full_name}`
}
