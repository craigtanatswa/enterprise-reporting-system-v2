"use client"

import { useMemo } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Eye, CheckCircle2, Clock, XCircle } from "lucide-react"
import Link from "next/link"
import { Progress } from "@/components/ui/progress"
import { TableExportMenu } from "@/components/ui/table-export-menu"

interface ApprovalWorkflow {
  id: string
  entity_type: string
  entity_id: string
  status: string
  current_level: number
  total_levels: number
  submitted_at: string
  completed_at: string | null
  submitted_by: { full_name: string; department: string } | null
}

export function ApprovalWorkflowsTable({ workflows }: { workflows: ApprovalWorkflow[] }) {
  const getStatusVariant = (status: string) => {
    switch (status) {
      case "pending":
        return "default"
      case "approved":
        return "default"
      case "rejected":
        return "destructive"
      case "revision_requested":
        return "secondary"
      default:
        return "outline"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="h-4 w-4" />
      case "approved":
        return <CheckCircle2 className="h-4 w-4" />
      case "rejected":
        return <XCircle className="h-4 w-4" />
      default:
        return null
    }
  }

  const getEntityLabel = (type: string) => {
    const labels: Record<string, string> = {
      document: "Document",
      production_report: "Production",
      dispatch_report: "Dispatch",
      processing_report: "Processing",
    }
    return labels[type] || type
  }

  const exportData = useMemo(() => {
    const headers = ["Type", "Submitted by", "Department", "Progress", "Status", "Submitted"]
    const rows = workflows.map((w) => [
      getEntityLabel(w.entity_type),
      w.submitted_by?.full_name || "Unknown",
      w.submitted_by?.department || "N/A",
      `${w.current_level}/${w.total_levels}`,
      w.status.replace(/_/g, " "),
      new Date(w.submitted_at).toLocaleDateString(),
    ])
    return { headers, rows }
  }, [workflows])

  if (workflows.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <CheckCircle2 className="h-12 w-12 text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">No workflows found</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardContent className="p-0">
        <div className="flex justify-end border-b px-4 py-2">
          <TableExportMenu
            fileBaseName="approval-workflows"
            sheetName="Workflows"
            title="Approval workflows"
            headers={exportData.headers}
            rows={exportData.rows}
          />
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Type</TableHead>
              <TableHead>Submitted By</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Progress</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Submitted</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {workflows.map((workflow) => {
              const progress = (workflow.current_level / workflow.total_levels) * 100

              return (
                <TableRow key={workflow.id}>
                  <TableCell>
                    <Badge variant="outline">{getEntityLabel(workflow.entity_type)}</Badge>
                  </TableCell>
                  <TableCell className="font-medium">{workflow.submitted_by?.full_name || "Unknown"}</TableCell>
                  <TableCell>{workflow.submitted_by?.department || "N/A"}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Progress value={progress} className="h-2 w-20" />
                      <span className="text-sm text-muted-foreground">
                        {workflow.current_level}/{workflow.total_levels}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(workflow.status)}
                      <Badge variant={getStatusVariant(workflow.status)}>{workflow.status.replace("_", " ")}</Badge>
                    </div>
                  </TableCell>
                  <TableCell>{new Date(workflow.submitted_at).toLocaleDateString()}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/dashboard/approvals/${workflow.id}`}>
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
