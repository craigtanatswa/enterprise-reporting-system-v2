"use client"

import { useMemo } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Eye, Truck } from "lucide-react"
import Link from "next/link"
import { getDepartmentLabel } from "@/lib/utils/permissions"
import { TableExportMenu } from "@/components/ui/table-export-menu"

interface DispatchReport {
  id: string
  dispatch_date: string
  department: string
  vehicle_number: string
  driver_name: string
  destination: string
  product_name: string
  quantity: number
  unit: string
  invoice_number: string | null
  customer_name: string
  created_by: { full_name: string } | null
}

export function DispatchReportsTable({ reports }: { reports: DispatchReport[] }) {
  const exportData = useMemo(() => {
    const headers = [
      "Date",
      "Vehicle",
      "Driver",
      "Product",
      "Quantity",
      "Customer",
      "Invoice",
      "Destination",
      "Department",
    ]
    const rows = reports.map((r) => [
      new Date(r.dispatch_date).toLocaleDateString(),
      r.vehicle_number,
      r.driver_name,
      r.product_name,
      `${Number(r.quantity).toLocaleString()} ${r.unit}`,
      r.customer_name,
      r.invoice_number || "",
      r.destination,
      getDepartmentLabel(r.department),
    ])
    return { headers, rows }
  }, [reports])

  if (reports.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <div className="rounded-full bg-muted p-3 mb-3">
            <Truck className="h-6 w-6 text-muted-foreground" />
          </div>
          <p className="text-sm text-muted-foreground">No dispatch reports found</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardContent className="p-0">
        <div className="flex justify-end border-b px-4 py-2">
          <TableExportMenu
            fileBaseName="dispatch-reports"
            sheetName="Dispatch"
            title="Dispatch reports"
            headers={exportData.headers}
            rows={exportData.rows}
          />
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Vehicle</TableHead>
              <TableHead>Product</TableHead>
              <TableHead className="text-right">Quantity</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Destination</TableHead>
              <TableHead>Department</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {reports.map((report) => (
              <TableRow key={report.id}>
                <TableCell>{new Date(report.dispatch_date).toLocaleDateString()}</TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-medium">{report.vehicle_number}</span>
                    <span className="text-xs text-muted-foreground">{report.driver_name}</span>
                  </div>
                </TableCell>
                <TableCell>{report.product_name}</TableCell>
                <TableCell className="text-right">
                  {Number(report.quantity).toLocaleString()} {report.unit}
                </TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-medium">{report.customer_name}</span>
                    {report.invoice_number && (
                      <Badge variant="outline" className="w-fit text-xs">
                        {report.invoice_number}
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell>{report.destination}</TableCell>
                <TableCell>{getDepartmentLabel(report.department)}</TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="sm" asChild>
                    <Link href={`/dashboard/dispatch/${report.id}`}>
                      <Eye className="h-4 w-4" />
                    </Link>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
