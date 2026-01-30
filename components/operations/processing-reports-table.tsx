"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Eye, Cog } from "lucide-react"
import Link from "next/link"
import { getDepartmentLabel } from "@/lib/utils/permissions"
import { Progress } from "@/components/ui/progress"

interface ProcessingReport {
  id: string
  report_date: string
  department: string
  batch_number: string
  raw_material: string
  raw_quantity: number
  processed_quantity: number
  waste_quantity: number
  unit: string
  processing_time_hours: number | null
  efficiency_percentage: number | null
  created_by: { full_name: string } | null
}

export function ProcessingReportsTable({ reports }: { reports: ProcessingReport[] }) {
  if (reports.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <div className="rounded-full bg-muted p-3 mb-3">
            <Cog className="h-6 w-6 text-muted-foreground" />
          </div>
          <p className="text-sm text-muted-foreground">No processing reports found</p>
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
              <TableHead>Batch</TableHead>
              <TableHead>Raw Material</TableHead>
              <TableHead className="text-right">Raw Qty</TableHead>
              <TableHead className="text-right">Processed</TableHead>
              <TableHead className="text-right">Waste</TableHead>
              <TableHead>Efficiency</TableHead>
              <TableHead>Department</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {reports.map((report) => {
              const efficiency = Number(report.efficiency_percentage) || 0
              return (
                <TableRow key={report.id}>
                  <TableCell>{new Date(report.report_date).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{report.batch_number}</Badge>
                  </TableCell>
                  <TableCell className="font-medium">{report.raw_material}</TableCell>
                  <TableCell className="text-right">
                    {Number(report.raw_quantity).toLocaleString()} {report.unit}
                  </TableCell>
                  <TableCell className="text-right">
                    {Number(report.processed_quantity).toLocaleString()} {report.unit}
                  </TableCell>
                  <TableCell className="text-right">
                    {Number(report.waste_quantity).toLocaleString()} {report.unit}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Progress value={efficiency} className="h-2 w-16" />
                      <span className="text-sm text-muted-foreground">{efficiency.toFixed(0)}%</span>
                    </div>
                  </TableCell>
                  <TableCell>{getDepartmentLabel(report.department)}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/dashboard/processing/${report.id}`}>
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
