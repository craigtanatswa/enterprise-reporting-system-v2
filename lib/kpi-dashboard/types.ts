export type MetricStatus = "green" | "amber" | "red"

export interface Comment {
  id: string
  author: string
  content: string
  timestamp: string
}

export interface MetricData {
  id: string
  name: string
  value: number | string
  unit?: string
  target?: number
  previousValue?: number | string
  status?: MetricStatus
  trend?: "up" | "down" | "stable"
  comments: Comment[]
  details?: string
  lastUpdated: string
  /** Optional sparkline-style seed data for UI that supports it */
  chart?: {
    points: { label: string; value: number }[]
  }
}

export interface DepartmentData {
  id: string
  name: string
  shortName: string
  icon: string
  metrics: MetricData[]
  head: string
}

export interface MDComment {
  id: string
  departmentId: string
  metricId?: string
  content: string
  timestamp: string
  isRead: boolean
}
