import { createClient } from "@/lib/supabase/server"
import { redirect, notFound } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Download, FileText, User, Calendar, Building } from "lucide-react"
import Link from "next/link"
import { getDepartmentLabel } from "@/lib/utils/permissions"

export default async function ReportDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const { data: report } = await supabase
    .from("general_reports")
    .select("*, uploaded_by:profiles!user_id(full_name, email)")
    .eq("id", id)
    .single()

  if (!report) {
    notFound()
  }

  const formatFileSize = (bytes: number) => {
    if (!bytes) return "—"
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard/reports">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{report.title}</h1>
            <p className="text-muted-foreground">
              {report.report_type?.replace(/_/g, " ")} • {getDepartmentLabel(report.department)}
            </p>
          </div>
        </div>
        {report.file_url && (
          <Button asChild>
            <a href={report.file_url} download={report.file_name}>
              <Download className="mr-2 h-4 w-4" />
              Download
            </a>
          </Button>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Report Details</CardTitle>
            <CardDescription>Information about this report</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {report.description && (
              <div>
                <p className="text-sm text-muted-foreground mb-2">Description</p>
                <p className="text-sm">{report.description}</p>
              </div>
            )}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <FileText className="h-4 w-4" />
                  <span>File Name</span>
                </div>
                <p className="font-medium">{report.file_name}</p>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <FileText className="h-4 w-4" />
                  <span>File Size</span>
                </div>
                <p className="font-medium">{formatFileSize(report.file_size)}</p>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <User className="h-4 w-4" />
                  <span>Submitted By</span>
                </div>
                <p className="font-medium">
                  {(report.uploaded_by as { full_name?: string })?.full_name || "Unknown"}
                </p>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>Submitted</span>
                </div>
                <p className="font-medium">
                  {report.submitted_at
                    ? new Date(report.submitted_at).toLocaleDateString()
                    : "—"}
                </p>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Building className="h-4 w-4" />
                  <span>Department</span>
                </div>
                <p className="font-medium">{getDepartmentLabel(report.department)}</p>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>Status</span>
                </div>
                <Badge variant="outline" className="capitalize">
                  {report.status}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Document Preview</CardTitle>
            <CardDescription>View or download the report file</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {report.file_url && (
              <>
                {report.file_type?.includes("pdf") ? (
                  <iframe
                    src={report.file_url}
                    className="w-full h-[400px] border rounded-md"
                    title="Report preview"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center py-8 border rounded-md bg-muted/30">
                    <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-sm text-muted-foreground mb-4">
                      Preview not available for this file type
                    </p>
                    <Button asChild>
                      <a href={report.file_url} download={report.file_name}>
                        <Download className="mr-2 h-4 w-4" />
                        Download to view
                      </a>
                    </Button>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
