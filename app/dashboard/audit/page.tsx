import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Shield, FileText, Eye, Activity } from "lucide-react"
import { canAccessAuditFeatures, getDepartmentLabel } from "@/lib/utils/permissions"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default async function AuditDashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

  if (!profile || !canAccessAuditFeatures(profile.role)) {
    redirect("/dashboard")
  }

  // Fetch all documents (AUDITOR has oversight - can view all)
  const { data: allDocuments } = await supabase
    .from("documents")
    .select("*, uploaded_by:uploaded_by(full_name, department)")
    .neq("report_type", "AUDIT_CONFIDENTIAL") // Auditors cannot see confidential audit reports
    .order("created_at", { ascending: false })
    .limit(20)

  // Fetch audit logs
  const { data: auditLogs } = await supabase
    .from("audit_logs")
    .select("*, actor:actor_id(full_name, email, role)")
    .order("created_at", { ascending: false })
    .limit(30)

  // Department statistics
  const { data: departmentStats } = await supabase.from("documents").select("department").neq("department", "AUDIT")

  const departmentCounts = departmentStats?.reduce(
    (acc, doc) => {
      acc[doc.department] = (acc[doc.department] || 0) + 1
      return acc
    },
    {} as Record<string, number>,
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Shield className="h-8 w-8 text-primary" />
            Audit Dashboard
          </h1>
          <p className="text-muted-foreground">Oversight and compliance monitoring</p>
        </div>
        {profile.role === "AUDITOR" && (
          <Button asChild>
            <Link href="/dashboard/audit/confidential/new">
              <FileText className="h-4 w-4 mr-2" />
              Submit Confidential Report
            </Link>
          </Button>
        )}
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Documents</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{allDocuments?.length || 0}</div>
            <p className="text-xs text-muted-foreground">Across all departments</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Departments</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Object.keys(departmentCounts || {}).length}</div>
            <p className="text-xs text-muted-foreground">Under oversight</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Audit Events</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{auditLogs?.length || 0}</div>
            <p className="text-xs text-muted-foreground">Recent activities</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Access Level</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Full</div>
            <p className="text-xs text-muted-foreground">Read-only oversight</p>
          </CardContent>
        </Card>
      </div>

      {/* Audit Tabs */}
      <Tabs defaultValue="documents" className="space-y-4">
        <TabsList>
          <TabsTrigger value="documents">All Documents</TabsTrigger>
          <TabsTrigger value="departments">By Department</TabsTrigger>
          <TabsTrigger value="audit-logs">Audit Logs</TabsTrigger>
          <TabsTrigger value="access-tracking">Access Tracking</TabsTrigger>
        </TabsList>

        <TabsContent value="documents" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Documents (All Departments)</CardTitle>
              <CardDescription>Read-only oversight view of all operational and financial reports</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {allDocuments?.map((doc: any) => (
                  <div key={doc.id} className="flex items-center justify-between border-b pb-4 last:border-0">
                    <div className="space-y-1">
                      <p className="font-medium">{doc.title}</p>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span className="font-medium">{getDepartmentLabel(doc.department)}</span>
                        <span>•</span>
                        <span>{doc.uploaded_by?.full_name}</span>
                        <span>•</span>
                        <span>{new Date(doc.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="outline" asChild>
                        <Link href={`/dashboard/documents/${doc.id}`}>
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Link>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="departments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Department Overview</CardTitle>
              <CardDescription>Document distribution across departments</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(departmentCounts || {}).map(([dept, count]) => (
                  <div key={dept} className="flex items-center justify-between">
                    <span className="font-medium">{getDepartmentLabel(dept as any)}</span>
                    <span className="text-2xl font-bold">{count}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="audit-logs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>System Audit Trail</CardTitle>
              <CardDescription>Immutable log of system activities</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {auditLogs?.map((log: any) => (
                  <div key={log.id} className="flex items-start gap-4 border-b pb-4 last:border-0">
                    <div className="rounded-full bg-primary/10 p-2">
                      <Activity className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <p className="text-sm font-medium">{log.action}</p>
                      <p className="text-sm text-muted-foreground">
                        {log.actor?.full_name || "System"} ({log.actor?.role || "N/A"})
                      </p>
                      <p className="text-xs text-muted-foreground">{new Date(log.created_at).toLocaleString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
