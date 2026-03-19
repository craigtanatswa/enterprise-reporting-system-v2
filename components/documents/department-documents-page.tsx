import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Upload, FileText, Eye, MoreVertical } from "lucide-react"
import Link from "next/link"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface DepartmentDocumentsPageProps {
  department: string
  departmentLabel: string
  basePath: string
}

export async function DepartmentDocumentsPage({ 
  department, 
  departmentLabel,
  basePath 
}: DepartmentDocumentsPageProps) {
  const supabase = await createClient()

  // Fetch documents for this department
  const { data: documents } = await supabase
    .from("documents")
    .select("*, uploaded_by:uploaded_by(full_name), reviewed_by:reviewed_by(full_name)")
    .eq("department", department)
    .order("created_at", { ascending: false })

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
      draft: { label: "Draft", variant: "secondary" },
      submitted: { label: "Submitted", variant: "default" },
      returned_with_comments: { label: "Returned with Comments", variant: "destructive" },
      reviewed_no_comments: { label: "Reviewed - No Comments", variant: "outline" },
      approved: { label: "Approved", variant: "default" },
    }
    const config = statusConfig[status] || { label: status, variant: "outline" as const }
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{departmentLabel} Documents</h1>
          <p className="text-muted-foreground">
            Submit, track, and manage department reports
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href={`${basePath}/guidelines`}>
              View Submission Guidelines
            </Link>
          </Button>
          <Button asChild>
            <Link href={`/dashboard/documents/upload?returnTo=${encodeURIComponent(`${basePath}/documents`)}`}>
              <Upload className="mr-2 h-4 w-4" />
              Upload New Report
            </Link>
          </Button>
        </div>
      </div>

      {/* Main Document Table */}
      <Card>
        <CardHeader>
          <CardTitle>Document Repository</CardTitle>
          <CardDescription>
            {documents?.length || 0} document(s) in this department
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!documents || documents.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="rounded-full bg-muted p-4 mb-4">
                <FileText className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium mb-2">No documents yet</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Upload your first report to get started with document tracking.
              </p>
              <Button asChild>
                <Link href={`/dashboard/documents/upload?returnTo=${encodeURIComponent(`${basePath}/documents`)}`}>
                  <Upload className="mr-2 h-4 w-4" />
                  Upload New Report
                </Link>
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Report Title</TableHead>
                  <TableHead>Reporting Period</TableHead>
                  <TableHead>Document Category</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Action Date</TableHead>
                  <TableHead>Current Reviewer</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {documents.map((doc) => (
                  <TableRow key={doc.id}>
                    <TableCell>
                      <div className="font-medium">{doc.title}</div>
                      <div className="text-xs text-muted-foreground">{doc.file_name}</div>
                    </TableCell>
                    <TableCell>{doc.reporting_period || "-"}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">
                        {(doc.category || "other").replace(/_/g, " ")}
                      </Badge>
                    </TableCell>
                    <TableCell>{getStatusBadge(doc.status)}</TableCell>
                    <TableCell>
                      {new Date(doc.updated_at || doc.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      {doc.reviewed_by?.full_name || (
                        doc.status === "submitted" ? "Pending HOD Review" : "-"
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/dashboard/documents/${doc.id}?returnTo=${encodeURIComponent(`${basePath}/documents`)}`}>
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </Link>
                          </DropdownMenuItem>
                          {doc.status === "returned_with_comments" && (
                            <DropdownMenuItem asChild>
                              <Link href={`/dashboard/documents/${doc.id}/new-version?returnTo=${encodeURIComponent(`${basePath}/documents`)}`}>
                                <Upload className="mr-2 h-4 w-4" />
                                Create New Version
                              </Link>
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
