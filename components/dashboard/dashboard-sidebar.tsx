"use client"

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import {
  LayoutDashboard,
  FileText,
  Factory,
  Users,
  Settings,
  Truck,
  Cog,
  Shield,
  Lock,
  TrendingUp,
  DollarSign,
  Target,
  Calendar,
  Scale,
  Server,
  ShoppingCart,
  Building,
  Newspaper,
  Sprout,
  Archive,
  BookOpen,
  Eye,
  ClipboardCheck,
  Upload,
} from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import Image from "next/image"
import { Suspense, useEffect, useState } from "react"
import { supabase } from "@/lib/supabase/client"
import type { UserRole, Department } from "@/lib/utils/permissions"
import {
  canAccessAuditFeatures,
  canViewConfidentialReports,
  isAdmin,
  isGeneralManager,
  isCorporateServicesManager,
} from "@/lib/utils/permissions"
import { getDepartmentSpecificNavigation } from "@/lib/utils/dashboard-routing"
import { KpiSidebarSection } from "@/components/dashboard/kpi-sidebar-section"

const navigationItems = {
  md: [
    { icon: Eye, label: "Submitted Reports", href: "/dashboard/md/reports" },
    { icon: LayoutDashboard, label: "Executive KPIs", href: "/dashboard/md/kpi" },
    { icon: Factory, label: "Factory Dashboard", href: "/dashboard/departments/factory" },
    { icon: Lock, label: "Confidential Reports", href: "/dashboard/md" },
  ],
  admin: [
    { icon: Shield, label: "Admin", href: "/dashboard/admin" },
    { icon: Users, label: "Users", href: "/dashboard/users" },
    { icon: Settings, label: "Settings", href: "/dashboard/settings" },
  ],
  gm: [{ icon: LayoutDashboard, label: "Dashboard", href: "/dashboard/gm" }],
  csm: [{ icon: LayoutDashboard, label: "Dashboard", href: "/dashboard/csm" }],
}

export function DashboardSidebar() {
  const pathname = usePathname()
  const [userRole, setUserRole] = useState<UserRole | null>(null)
  const [userDepartment, setUserDepartment] = useState<Department | null>(null)
  const [userSubDepartment, setUserSubDepartment] = useState<string | null>(null)

  useEffect(() => {
    async function getUserRole() {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("role, department, sub_department")
          .eq("id", user.id)
          .single()
        if (profile) {
          setUserRole(profile.role as UserRole)
          setUserDepartment(profile.department as Department)
          setUserSubDepartment(profile.sub_department)
        }
      }
    }
    getUserRole()
  }, [])

  const shouldShowAudit = userRole && canAccessAuditFeatures(userRole)
  const shouldShowMD = userRole && canViewConfidentialReports(userRole)
  const shouldShowAdmin = userRole && isAdmin(userRole)
  const shouldShowGM = userRole && isGeneralManager(userRole)
  const shouldShowCSM = userRole && isCorporateServicesManager(userRole)

  const departmentNavItems = getDepartmentSpecificNavigation(userDepartment, userSubDepartment)

  const iconMap: Record<string, any> = {
    LayoutDashboard,
    TrendingUp,
    DollarSign,
    Target,
    Users,
    Calendar,
    Scale,
    Server,
    ShoppingCart,
    Building,
    Newspaper,
    Sprout,
    Factory,
    Truck,
    Cog,
    Shield,
    Lock,
    FileText,
    Archive,
    BookOpen,
    Eye,
  }

  return (
    <Sidebar>
      <SidebarHeader className="border-b p-4">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="relative h-15 w-24">
            <Image src="/arda-logo.png" alt="ARDA Seeds" fill className="object-contain" priority />
          </div>
        </Link>
      </SidebarHeader>

      <SidebarContent>
        {shouldShowAdmin && (
          <SidebarGroup>
            <SidebarGroupLabel>Administration</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {navigationItems.admin.map((item) => {
                  const Icon = item.icon
                  const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`)
                  return (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton asChild isActive={isActive}>
                        <Link href={item.href}>
                          <Icon className="h-4 w-4" />
                          <span>{item.label}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {shouldShowGM && (
          <SidebarGroup>
            <SidebarGroupLabel>General Manager</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {navigationItems.gm.map((item) => {
                  const Icon = item.icon
                  const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`)
                  return (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton asChild isActive={isActive}>
                        <Link href={item.href}>
                          <Icon className="h-4 w-4" />
                          <span>{item.label}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {shouldShowCSM && (
          <SidebarGroup>
            <SidebarGroupLabel>Corporate Services Manager</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {navigationItems.csm.map((item) => {
                  const Icon = item.icon
                  const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`)
                  return (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton asChild isActive={isActive}>
                        <Link href={item.href}>
                          <Icon className="h-4 w-4" />
                          <span>{item.label}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {departmentNavItems.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel>Department</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {departmentNavItems.map((item) => {
                  const Icon = iconMap[item.icon] || FileText
                  const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`)
                  return (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton asChild isActive={isActive}>
                        <Link href={item.href}>
                          <Icon className="h-4 w-4" />
                          <span>{item.label}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        <Suspense fallback={null}>
          <KpiSidebarSection />
        </Suspense>

        {/* Balance Scorecard - Available to all staff and HODs */}
        <SidebarGroup>
          <SidebarGroupLabel>Performance Management</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={pathname.startsWith("/dashboard/balance-scorecard")}>
                  <Link href="/dashboard/balance-scorecard">
                    <ClipboardCheck className="h-4 w-4" />
                    <span>Balance Scorecard</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Reports - Available to all staff */}
        <SidebarGroup>
          <SidebarGroupLabel>Reports</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={pathname.startsWith("/dashboard/reports")}>
                  <Link href="/dashboard/reports">
                    <Upload className="h-4 w-4" />
                    <span>Upload Reports</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {shouldShowAudit && (
          <SidebarGroup>
            <SidebarGroupLabel>Audit Access</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={pathname === "/dashboard/audit/all-documents"}>
                    <Link href="/dashboard/audit/all-documents">
                      <Eye className="h-4 w-4" />
                      <span>All Documents</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {shouldShowMD && (
          <SidebarGroup>
            <SidebarGroupLabel>Managing Director</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {navigationItems.md.map((item) => {
                  const Icon = item.icon
                  const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`)
                  return (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton asChild isActive={isActive}>
                        <Link href={item.href}>
                          <Icon className="h-4 w-4" />
                          <span>{item.label}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>
    </Sidebar>
  )
}
