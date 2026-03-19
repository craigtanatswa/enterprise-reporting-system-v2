import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, FileText, Download, Eye } from "lucide-react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { getDepartmentLabel } from "@/lib/utils/permissions"

export default async function ReportsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

  if (!profile) {
    redirect("/auth/login")
  }

  // Fetch reports for the user's department
  const { data: reports } = await supabase
    .from("general_reports")
    .select("*")
    .order("submitted_at", { ascending: false })
    .limit(20)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Reports</h1>
          <p className="text-muted-foreground">Upload and manage departmental reports</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/reports/upload">
            <Plus className="h-4 w-4 mr-2" />
            Upload Report
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Reports</CardTitle>
          <CardDescription>Reports from your department and organization</CardDescription>
        </CardHeader>
        <CardContent>
          {reports && reports.length > 0 ? (
            <div className="space-y-4">
              {reports.map((report) => (
                <div
                  key={report.id}
                  className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0"
                >
                  <div className="flex items-start gap-4">
                    <div className="rounded-lg bg-muted p-2">
                      <FileText className="h-5 w-5" />
                    </div>
                    <div className="space-y-1">
                      <p className="font-medium">{report.title}</p>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>{getDepartmentLabel(report.department)}</span>
                        <span>•</span>
                        <span className="capitalize">{report.report_type}</span>
                        <span>•</span>
                        <span>{new Date(report.submitted_at).toLocaleDateString()}</span>
                        {report.is_confidential && (
                          <>
                            <span>•</span>
                            <Badge variant="outline" className="text-xs">
                              Confidential
                            </Badge>
                          </>
                        )}
                      </div>
                      {report.description && (
                        <p className="text-sm text-muted-foreground line-clamp-1">{report.description}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{report.status}</Badge>
                    <Button variant="ghost" size="sm" asChild title="View">
                      <Link href={`/dashboard/reports/${report.id}`}>
                        <Eye className="h-4 w-4" />
                      </Link>
                    </Button>
                    {report.file_url && (
                      <Button variant="ghost" size="sm" asChild title="Download">
                        <a href={report.file_url} download={report.file_name}>
                          <Download className="h-4 w-4" />
                        </a>
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No reports yet</h3>
              <p className="text-muted-foreground mb-4">Upload your first departmental report to get started</p>
              <Button asChild>
                <Link href="/dashboard/reports/upload">
                  <Plus className="h-4 w-4 mr-2" />
                  Upload Report
                </Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
