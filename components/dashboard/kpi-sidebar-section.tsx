"use client"

import type { ComponentType } from "react"
import Link from "next/link"
import { usePathname, useSearchParams } from "next/navigation"
import {
  LayoutDashboard,
  Wheat,
  Factory,
  TrendingUp,
  DollarSign,
  Users,
  ShoppingCart,
  Monitor,
  Warehouse,
  Shield,
  MessageSquare,
  ChevronDown,
  Bell,
} from "lucide-react"
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from "@/components/ui/sidebar"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { useKpiDashboardOptional } from "@/components/kpi-dashboard/kpi-dashboard-provider"
import { cn } from "@/lib/utils"

const iconMap: Record<string, ComponentType<{ className?: string }>> = {
  LayoutDashboard,
  Wheat,
  Factory,
  TrendingUp,
  DollarSign,
  Users,
  ShoppingCart,
  Monitor,
  Warehouse,
  Shield,
}

export function KpiSidebarSection() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const kpi = useKpiDashboardOptional()

  if (!kpi?.kpiEnabled) {
    return null
  }

  const {
    departments,
    hasFullKpiAccess,
    hideExecutiveOverviewInKpiNav,
    primarySegment,
    getUnreadCountByDepartment,
    setSelectedDepartment,
  } = kpi

  const nonExecutive = departments.filter((d) => d.id !== "executive")
  const deptParam = searchParams.get("dept")

  const handleDeptNav = (id: string) => {
    setSelectedDepartment(id)
  }

  if (hasFullKpiAccess) {
    return (
      <>
        <SidebarSeparator />
        <SidebarGroup>
          <SidebarGroupLabel>KPI dashboards</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {!hideExecutiveOverviewInKpiNav && (
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname.startsWith("/dashboard/md/kpi") && !pathname.includes("md-comments")}
                  >
                    <Link href="/dashboard/md/kpi" onClick={() => handleDeptNav("executive")}>
                      <LayoutDashboard className="h-4 w-4" />
                      <span>Executive overview</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
              {nonExecutive.map((dept) => {
                const Icon = iconMap[dept.icon] || LayoutDashboard
                const href = `/dashboard/kpi?dept=${encodeURIComponent(dept.id)}`
                const isActive = pathname === "/dashboard/kpi" && deptParam === dept.id
                return (
                  <SidebarMenuItem key={dept.id}>
                    <SidebarMenuButton asChild isActive={isActive}>
                      <Link href={href} onClick={() => handleDeptNav(dept.id)}>
                        <Icon className="h-4 w-4" />
                        <span>{dept.shortName}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator />
        <SidebarGroup>
          <Collapsible defaultOpen className="group/collapsible">
            <SidebarGroupLabel asChild>
              <CollapsibleTrigger className="flex w-full cursor-pointer items-center gap-2">
                <span>MD comments</span>
                <Bell className="ml-auto size-3 opacity-50" />
                <ChevronDown className="size-3 transition-transform group-data-[state=open]/collapsible:rotate-180" />
              </CollapsibleTrigger>
            </SidebarGroupLabel>
            <CollapsibleContent>
              <SidebarGroupContent>
                <SidebarMenu>
                  {nonExecutive.map((dept) => {
                    const unread = getUnreadCountByDepartment(dept.id)
                    return (
                      <SidebarMenuItem key={`mdc-${dept.id}`}>
                        <SidebarMenuButton asChild>
                          <Link href={`/dashboard/kpi/md-comments/${dept.id}`}>
                            <MessageSquare className="h-4 w-4" />
                            <span className="truncate">{dept.shortName}</span>
                            {unread > 0 && (
                              <SidebarMenuBadge className="bg-[oklch(0.75_0.12_85)] text-[oklch(0.25_0.02_85)]">
                                {unread} unread
                              </SidebarMenuBadge>
                            )}
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    )
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </CollapsibleContent>
          </Collapsible>
        </SidebarGroup>
      </>
    )
  }

  if (!primarySegment) {
    return null
  }

  const totalUnread = getUnreadCountByDepartment(primarySegment)

  return (
    <>
      <SidebarSeparator />
      <SidebarGroup>
        <SidebarGroupLabel>Performance KPIs</SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={pathname === "/dashboard/kpi"}>
                <Link href="/dashboard/kpi">
                  <LayoutDashboard className="h-4 w-4" />
                  <span>Department KPIs</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={pathname.startsWith(`/dashboard/kpi/md-comments/${primarySegment}`)}>
                <Link href={`/dashboard/kpi/md-comments/${primarySegment}`}>
                  <MessageSquare className={cn("h-4 w-4", totalUnread > 0 && "text-[oklch(0.6_0.2_25)]")} />
                  <span>MD feedback</span>
                  {totalUnread > 0 && (
                    <SidebarMenuBadge className="bg-[oklch(0.6_0.2_25)] text-white">{totalUnread}</SidebarMenuBadge>
                  )}
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
    </>
  )
}
