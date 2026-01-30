"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"

interface DepartmentData {
  department: string
  production_reports_count: number
  dispatch_reports_count: number
  processing_reports_count: number
  avg_efficiency: number
  active_users: number
}

export function DepartmentPerformance({ data }: { data: DepartmentData[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Department Performance</CardTitle>
        <CardDescription>Operational metrics across all departments</CardDescription>
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
