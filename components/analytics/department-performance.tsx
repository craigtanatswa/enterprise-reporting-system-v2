"use client"

import { useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { TableExportMenu } from "@/components/ui/table-export-menu"

interface DepartmentData {
  department: string
  production_reports_count: number
  dispatch_reports_count: number
  processing_reports_count: number
  avg_efficiency: number
  active_users: number
}

export function DepartmentPerformance({ data }: { data: DepartmentData[] }) {
  const exportData = useMemo(() => {
    const headers = ["Department", "Production", "Dispatch", "Processing", "Efficiency %", "Users"]
    const rows = data.map((dept) => {
      const efficiency = Number(dept.avg_efficiency) || 0
      return [
        dept.department,
        dept.production_reports_count,
        dept.dispatch_reports_count,
        dept.processing_reports_count,
        `${efficiency.toFixed(0)}%`,
        dept.active_users,
      ]
    })
    return { headers, rows }
  }, [data])

  return (
    <Card>
      <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between sm:space-y-0">
        <div className="space-y-1.5">
          <CardTitle>Department Performance</CardTitle>
          <CardDescription>Operational metrics across all departments</CardDescription>
        </div>
        {data.length > 0 && (
          <TableExportMenu
            fileBaseName="department-performance"
            sheetName="Performance"
            title="Department performance"
            headers={exportData.headers}
            rows={exportData.rows}
            className="shrink-0"
          />
        )}
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Department</TableHead>
              <TableHead className="text-center">Production</TableHead>
              <TableHead className="text-center">Dispatch</TableHead>
              <TableHead className="text-center">Processing</TableHead>
              <TableHead>Efficiency</TableHead>
              <TableHead className="text-center">Users</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((dept) => {
              const efficiency = Number(dept.avg_efficiency) || 0
              return (
                <TableRow key={dept.department}>
                  <TableCell className="font-medium">{dept.department}</TableCell>
                  <TableCell className="text-center">
                    <Badge variant="outline">{dept.production_reports_count}</Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="outline">{dept.dispatch_reports_count}</Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="outline">{dept.processing_reports_count}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Progress value={efficiency} className="h-2 w-20" />
                      <span className="text-sm text-muted-foreground">{efficiency.toFixed(0)}%</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">{dept.active_users}</TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
