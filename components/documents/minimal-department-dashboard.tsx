import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { FileText, Clock, AlertCircle, CheckCircle } from "lucide-react"
import Link from "next/link"

interface MinimalDepartmentDashboardProps {
  department: string
  departmentLabel: string
  basePath: string
}

export async function MinimalDepartmentDashboard({ 
  department, 
  departmentLabel,
  basePath 
}: MinimalDepartmentDashboardProps) {
  const supabase = await createClient()

  // Fetch document counts
  const { count: totalDocs } = await supabase
    .from("documents")
    .select("*", { count: "exact", head: true })
    .eq("department", department)

  const { count: pendingReviews } = await supabase
    .from("documents")
    .select("*", { count: "exact", head: true })
    .eq("department", department)
    .eq("status", "submitted")

  const { count: returnedDocs } = await supabase
    .from("documents")
    .select("*", { count: "exact", head: true })
    .eq("department", department)
    .eq("status", "returned_with_comments")

  const { count: approvedDocs } = await supabase
    .from("documents")
    .select("*", { count: "exact", head: true })
    .eq("department", department)
    .eq("status", "approved")

  const widgets = [
    {
      title: "Documents Submitted",
      value: totalDocs || 0,
      description: "Total documents in repository",
      icon: FileText,
      href: `${basePath}/documents`,
      color: "text-blue-600",
    },
    {
      title: "Pending Reviews",
      value: pendingReviews || 0,
      description: "Awaiting HOD/MD review",
      icon: Clock,
      href: `${basePath}/documents?status=submitted`,
      color: "text-amber-600",
    },
    {
      title: "Returned for Revision",
      value: returnedDocs || 0,
      description: "Requires new version",
      icon: AlertCircle,
      href: `${basePath}/documents?status=returned_with_comments`,
      color: "text-red-600",
    },
    {
      title: "Approved",
      value: approvedDocs || 0,
      description: "Successfully approved",
      icon: CheckCircle,
      href: `${basePath}/documents?status=approved`,
      color: "text-green-600",
    },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{departmentLabel} Dashboard</h1>
        <p className="text-muted-foreground">
          Document submission and approval status overview
        </p>
      </div>

      {/* Status Widgets - Each links back to Documents page with filter */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {widgets.map((widget) => {
          const Icon = widget.icon
          return (
            <Link key={widget.title} href={widget.href}>
              <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{widget.title}</CardTitle>
                  <Icon className={`h-4 w-4 ${widget.color}`} />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{widget.value}</div>
                  <p className="text-xs text-muted-foreground">{widget.description}</p>
                </CardContent>
              </Card>
            </Link>
          )
        })}
      </div>

      {/* Info Card */}
      <Card>
        <CardHeader>
          <CardTitle>About This Dashboard</CardTitle>
          <CardDescription>Understanding your department metrics</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            This dashboard provides a quick overview of your document submission status. 
            Click on any metric card to view the filtered list of documents.
          </p>
          <div className="text-sm space-y-2">
            <p><strong>Documents Submitted:</strong> Total count of all documents uploaded by your department.</p>
            <p><strong>Pending Reviews:</strong> Documents waiting for HOD or MD review.</p>
            <p><strong>Returned for Revision:</strong> Documents that need corrections - create a new version to resubmit.</p>
            <p><strong>Approved:</strong> Documents that have completed the approval workflow.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
