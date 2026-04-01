import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { FileText, Clock, AlertCircle, CheckCircle } from "lucide-react"
import Link from "next/link"

interface DocumentMetricsSummaryProps {
  department: string
  departmentLabel: string
  basePath: string
}

export async function DocumentMetricsSummary({
  department,
  departmentLabel,
  basePath,
}: DocumentMetricsSummaryProps) {
  const supabase = await createClient()

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
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold tracking-tight">Document metrics</h2>
        <p className="text-sm text-muted-foreground">
          Submission and approval status for {departmentLabel}. Click a card to filter the table below.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {widgets.map((widget) => {
          const Icon = widget.icon
          return (
            <Link key={widget.title} href={widget.href}>
              <Card className="h-full transition-colors hover:bg-muted/50">
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
      <Card>
        <CardHeader>
          <CardTitle className="text-base">About these metrics</CardTitle>
          <CardDescription>How document workflow counts are defined</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>
            <strong className="text-foreground">Documents Submitted:</strong> Total documents uploaded by your
            department.
          </p>
          <p>
            <strong className="text-foreground">Pending Reviews:</strong> Awaiting HOD or MD review.
          </p>
          <p>
            <strong className="text-foreground">Returned for Revision:</strong> Create a new version to resubmit.
          </p>
          <p>
            <strong className="text-foreground">Approved:</strong> Completed the approval workflow.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
