"use client"

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import type { DepartmentData, MDComment, MetricData } from "@/lib/kpi-dashboard/types"
import { getDepartmentScorecard } from "@/lib/kpi-dashboard/initial-data"
import {
  markAllKpiMdCommentsReadForSegmentAction,
  markKpiMdCommentReadAction,
} from "@/app/actions/kpi-dashboard"

interface KpiDashboardContextType {
  kpiEnabled: boolean
  departments: DepartmentData[]
  selectedDepartment: string
  setSelectedDepartment: (id: string) => void
  getDepartment: (id: string) => DepartmentData | undefined
  getMetric: (departmentId: string, metricId: string) => MetricData | undefined
  mdComments: MDComment[]
  hasFullKpiAccess: boolean
  viewerIsMd: boolean
  primarySegment: string | null
  canEditDepartmentMetrics: boolean
  viewerIsFactoryStaff: boolean
  /** Confidential / MD-style access to factory data without being factory staff (read-only in merged manufacturing view). */
  viewerFactoryObserverMode: boolean
  scorecard: ReturnType<typeof getDepartmentScorecard>
  refresh: () => void
  getUnreadCountByDepartment: (departmentId: string) => number
  markAllDepartmentCommentsRead: (departmentId: string) => Promise<void>
  markMDCommentRead: (commentId: string) => Promise<void>
}

const KpiDashboardContext = createContext<KpiDashboardContextType | null>(null)

export function KpiDashboardProvider({
  children,
  kpiEnabled,
  departments: initialDepartments,
  mdComments: initialMdComments,
  hasFullKpiAccess,
  viewerIsMd,
  primarySegment,
  canEditDepartmentMetrics,
  viewerIsFactoryStaff,
  viewerFactoryObserverMode,
}: {
  children: React.ReactNode
  kpiEnabled: boolean
  departments: DepartmentData[]
  mdComments: MDComment[]
  hasFullKpiAccess: boolean
  viewerIsMd: boolean
  primarySegment: string | null
  canEditDepartmentMetrics: boolean
  viewerIsFactoryStaff: boolean
  viewerFactoryObserverMode: boolean
}) {
  const router = useRouter()
  const [departments, setDepartments] = useState(initialDepartments)
  const [mdComments, setMdComments] = useState(initialMdComments)
  const [selectedDepartment, setSelectedDepartment] = useState(() =>
    hasFullKpiAccess ? "executive" : primarySegment || "executive"
  )

  useEffect(() => {
    setDepartments(initialDepartments)
    setMdComments(initialMdComments)
  }, [initialDepartments, initialMdComments])

  useEffect(() => {
    if (!hasFullKpiAccess && primarySegment) {
      setSelectedDepartment(primarySegment)
    }
  }, [hasFullKpiAccess, primarySegment])

  const refresh = useCallback(() => {
    router.refresh()
  }, [router])

  const getDepartment = useCallback(
    (id: string) => departments.find((d) => d.id === id),
    [departments]
  )

  const getMetric = useCallback(
    (departmentId: string, metricId: string) => {
      const dept = departments.find((d) => d.id === departmentId)
      return dept?.metrics.find((m) => m.id === metricId)
    },
    [departments]
  )

  const scorecard = useMemo(
    () => (kpiEnabled ? getDepartmentScorecard(departments) : []),
    [departments, kpiEnabled]
  )

  const getUnreadCountByDepartment = useCallback(
    (departmentId: string) => {
      return mdComments.filter((c) => c.departmentId === departmentId && !c.isRead).length
    },
    [mdComments]
  )

  const markAllDepartmentCommentsRead = useCallback(async (departmentId: string) => {
    await markAllKpiMdCommentsReadForSegmentAction(departmentId)
    setMdComments((prev) =>
      prev.map((c) => (c.departmentId === departmentId ? { ...c, isRead: true } : c))
    )
    refresh()
  }, [refresh])

  const markMDCommentRead = useCallback(
    async (commentId: string) => {
      await markKpiMdCommentReadAction(commentId)
      setMdComments((prev) => prev.map((c) => (c.id === commentId ? { ...c, isRead: true } : c)))
      refresh()
    },
    [refresh]
  )

  const value = useMemo(
    () => ({
      kpiEnabled,
      departments,
      selectedDepartment,
      setSelectedDepartment,
      getDepartment,
      getMetric,
      mdComments,
      hasFullKpiAccess,
      viewerIsMd,
      primarySegment,
      canEditDepartmentMetrics,
      viewerIsFactoryStaff,
      viewerFactoryObserverMode,
      scorecard,
      refresh,
      getUnreadCountByDepartment,
      markAllDepartmentCommentsRead,
      markMDCommentRead,
    }),
    [
      kpiEnabled,
      departments,
      selectedDepartment,
      getDepartment,
      getMetric,
      mdComments,
      hasFullKpiAccess,
      viewerIsMd,
      primarySegment,
      canEditDepartmentMetrics,
      viewerIsFactoryStaff,
      viewerFactoryObserverMode,
      scorecard,
      refresh,
      getUnreadCountByDepartment,
      markAllDepartmentCommentsRead,
      markMDCommentRead,
    ]
  )

  return <KpiDashboardContext.Provider value={value}>{children}</KpiDashboardContext.Provider>
}

export function useKpiDashboard() {
  const ctx = useContext(KpiDashboardContext)
  if (!ctx) {
    throw new Error("useKpiDashboard must be used within KpiDashboardProvider")
  }
  return ctx
}

export function useKpiDashboardOptional() {
  return useContext(KpiDashboardContext)
}
