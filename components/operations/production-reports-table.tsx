"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Eye, TrendingUp, TrendingDown } from "lucide-react"
import Link from "next/link"
import { getDepartmentLabel } from "@/lib/utils/permissions"

interface ProductionReport {
  id: string
  report_date: string
  department: string
  shift: string
  product_name: string
  target_quantity: number
  actual_quantity: number
  unit: string
  quality_grade: string | null
  status: string
  created_by: { full_name: string } | null
}

export function ProductionReportsTable({ reports }: { reports: ProductionReport[] }) {
  const getStatusVariant = (status: string) => {
    switch (status) {
      case "planned":
        return "secondary"
      case "in_progress":
        return "default"
      case "completed":
        return "default"
      case "delayed":
        return "destructive"
      default:
        return "outline"
    }
  }

  const getShiftLabel = (shift: string) => {
    const labels: Record<string, string> = {
      morning: "Morning",
      afternoon: "Afternoon",
      night: "Night",
    }
    return labels[shift] || shift
  }

  if (reports.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <p className="text-sm text-muted-foreground">No production reports found</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Product</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Shift</TableHead>
              <TableHead className="text-right">Target</TableHead>
              <TableHead className="text-right">Actual</TableHead>
              <TableHead className="text-right">Achievement</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {reports.map((report) => {
              const achievement = (Number(report.actual_quantity) / Number(report.target_quantity)) * 100
              const isAboveTarget = achievement >= 100

              return (
                <TableRow key={report.id}>
                  <TableCell>{new Date(report.report_date).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium">{report.product_name}</span>
                      {report.quality_grade && (
                        <span className="text-xs text-muted-foreground">Grade: {report.quality_grade}</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{getDepartmentLabel(report.department)}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{getShiftLabel(report.shift)}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {Number(report.target_quantity).toLocaleString()} {report.unit}
                  </TableCell>
                  <TableCell className="text-right">
                    {Number(report.actual_quantity).toLocaleString()} {report.unit}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      {isAboveTarget ? (
                        <TrendingUp className="h-3 w-3 text-green-500" />
                      ) : (
                        <TrendingDown className="h-3 w-3 text-destructive" />
                      )}
                      <span className={isAboveTarget ? "text-green-500" : "text-destructive"}>
                        {achievement.toFixed(0)}%
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusVariant(report.status)}>{report.status.replace("_", " ")}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/dashboard/production/${report.id}`}>
                        <Eye className="h-4 w-4" />
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
