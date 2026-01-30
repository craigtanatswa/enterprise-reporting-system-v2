import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Shield, Users, Building2, FileText, Activity, AlertTriangle } from "lucide-react"
import { hasPermission, getRoleLabel, getDepartmentLabel } from "@/lib/utils/permissions"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"

export default async function AdminDashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

  if (!profile || !hasPermission(profile.role, "systemConfiguration")) {
    redirect("/dashboard")
  }

  // Fetch admin dashboard statistics
  const { count: totalUsers } = await supabase.from("profiles").select("*", { count: "exact", head: true })

  const { count: adminCount } = await supabase
    .from("profiles")
    .select("*", { count: "exact", head: true })
    .in("role", ["ADMIN", "BOOTSTRAP_ADMIN"])

  const { count: activeUsers } = await supabase
    .from("profiles")
    .select("*", { count: "exact", head: true })
    .eq("is_active", true)

  const { data: pendingApprovals } = await supabase
    .from("profiles")
    .select("*")
    .eq("requires_approval", true)
    .eq("is_active", false)
    .order("created_at", { ascending: false })

  const { data: recentAuditLogs } = await supabase
    .from("audit_logs")
    .select("*, actor:actor_id(full_name, email)")
    .order("created_at", { ascending: false })
    .limit(10)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Shield className="h-8 w-8 text-primary" />
            Administrator Dashboard
          </h1>
          <p className="text-muted-foreground">System control center for ARDA Seeds platform</p>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalUsers}</div>
            <p className="text-xs text-muted-foreground">Registered accounts</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Administrators</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{adminCount}</div>
            <p className="text-xs text-muted-foreground">Admin & Bootstrap Admin</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeUsers}</div>
            <p className="text-xs text-muted-foreground">Currently active</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Departments</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">9</div>
            <p className="text-xs text-muted-foreground">System departments</p>
          </CardContent>
        </Card>
      </div>

      {pendingApprovals && pendingApprovals.length > 0 && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Pending Account Approvals</AlertTitle>
          <AlertDescription>
            {pendingApprovals.length} user account{pendingApprovals.length > 1 ? "s" : ""} require{" "}
            {pendingApprovals.length === 1 ? "s" : ""} approval before activation.
            <Button variant="link" className="px-2" asChild>
              <Link href="/dashboard/admin/approvals">Review Pending Accounts →</Link>
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Admin Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="users">User Management</TabsTrigger>
          <TabsTrigger value="departments">Departments</TabsTrigger>
          <TabsTrigger value="audit">Audit Logs</TabsTrigger>
          <TabsTrigger value="approvals">
            Pending Approvals {pendingApprovals && pendingApprovals.length > 0 && `(${pendingApprovals.length})`}
          </TabsTrigger>
          <TabsTrigger value="config">System Config</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>System Overview</CardTitle>
              <CardDescription>Quick access to administrative functions</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">User & Role Management</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-3">
                      Create, invite, and manage user accounts and permissions
                    </p>
                    <a
                      href="/dashboard/users"
                      className="text-sm text-primary hover:underline inline-flex items-center"
                    >
                      Manage Users →
                    </a>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Department Management</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-3">View department hierarchy and assign heads</p>
                    <a
                      href="/dashboard/admin/departments"
                      className="text-sm text-primary hover:underline inline-flex items-center"
                    >
                      Manage Departments →
                    </a>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Report Governance</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-3">View and manage reports across all departments</p>
                    <a
                      href="/dashboard/admin/reports"
                      className="text-sm text-primary hover:underline inline-flex items-center"
                    >
                      View Reports →
                    </a>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Audit & Compliance</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-3">Access immutable audit trail and system logs</p>
                    <a
                      href="/dashboard/admin/audit"
                      className="text-sm text-primary hover:underline inline-flex items-center"
                    >
                      View Audit Logs →
                    </a>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="audit" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Audit Logs</CardTitle>
              <CardDescription>System activity and security events</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentAuditLogs?.map((log: any) => (
                  <div key={log.id} className="flex items-start gap-4 border-b pb-4 last:border-0 last:pb-0">
                    <div className="rounded-full bg-primary/10 p-2">
                      <FileText className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <p className="text-sm font-medium">{log.action}</p>
                      <p className="text-sm text-muted-foreground">
                        {log.actor?.full_name || "System"} - {log.entity_type}
                      </p>
                      <p className="text-xs text-muted-foreground">{new Date(log.created_at).toLocaleString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="approvals" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Pending Account Approvals</CardTitle>
              <CardDescription>
                Accounts requiring admin approval before activation (AUDITOR, MANAGING_DIRECTOR)
              </CardDescription>
            </CardHeader>
            <CardContent>
              {pendingApprovals && pendingApprovals.length > 0 ? (
                <div className="space-y-4">
                  {pendingApprovals.map((pendingUser: any) => (
                    <div key={pendingUser.id} className="flex items-center justify-between border-b pb-4 last:border-0">
                      <div className="space-y-1">
                        <p className="font-medium">{pendingUser.full_name}</p>
                        <p className="text-sm text-muted-foreground">{pendingUser.email}</p>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{getRoleLabel(pendingUser.role)}</Badge>
                          <Badge variant="secondary">{getDepartmentLabel(pendingUser.department)}</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Registered: {new Date(pendingUser.created_at).toLocaleString()}
                        </p>
                      </div>
                      <Button size="sm" asChild>
                        <Link href={`/dashboard/admin/approvals/${pendingUser.id}`}>Review & Approve</Link>
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">No pending approvals</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
