"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Clock } from "lucide-react"
import Link from "next/link"

interface PendingApproval {
  workflow_id: string
  entity_type: string
  entity_id: string
  current_level: number
  total_levels: number
  submitted_at: string
  submitted_by_name: string
  submitter_department: string
  approver_role: string
  step_status: string
}

export function PendingApprovalsTable({ data }: { data: PendingApproval[] }) {
  const getEntityLabel = (type: string) => {
    const labels: Record<string, string> = {
      document: "Document",
      production_report: "Production",
      dispatch_report: "Dispatch",
      processing_report: "Processing",
    }
    return labels[type] || type
  }

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffHours / 24)

    if (diffDays > 0) return `${diffDays}d ago`
    if (diffHours > 0) return `${diffHours}h ago`
    return "Just now"
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Pending Approvals</CardTitle>
        <CardDescription>Items awaiting review and approval</CardDescription>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="rounded-full bg-muted p-3 mb-3">
              <Clock className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">No pending approvals</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead>Submitted By</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Level</TableHead>
                <TableHead>Pending Since</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((approval) => (
                <TableRow key={approval.workflow_id}>
                  <TableCell>
                    <Badge variant="outline">{getEntityLabel(approval.entity_type)}</Badge>
                  </TableCell>
                  <TableCell className="font-medium">{approval.submitted_by_name}</TableCell>
                  <TableCell>{approval.submitter_department}</TableCell>
                  <TableCell>
                    <span className="text-sm text-muted-foreground">
                      {approval.current_level}/{approval.total_levels}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {formatTimeAgo(approval.submitted_at)}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/dashboard/approvals/${approval.workflow_id}`}>Review</Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}
