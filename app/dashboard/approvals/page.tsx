import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ApprovalWorkflowsTable } from "@/components/approvals/approval-workflows-table"
import { CheckCircle2, Clock, XCircle, AlertCircle } from "lucide-react"

export default async function ApprovalsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const { data: profile } = await supabase.from("profiles").select("role, department").eq("id", user.id).single()

  // Check if user has approval permissions
  if (!profile || !["md", "admin", "factory_manager"].includes(profile.role)) {
    redirect("/dashboard")
  }

  // Fetch all approval workflows
  const { data: allWorkflows } = await supabase
    .from("approval_workflows")
    .select("*, submitted_by(full_name, department)")
    .order("submitted_at", { ascending: false })

  // Fetch workflows where user is approver
  const { data: myApprovals } = await supabase
    .from("approval_steps")
    .select("*, workflow_id(*, submitted_by(full_name))")
    .or(`approver_id.eq.${user.id},approver_role.eq.${profile.role}`)
    .eq("status", "pending")

  // Group workflows by status
  const pendingWorkflows = allWorkflows?.filter((w) => w.status === "pending") || []
  const approvedWorkflows = allWorkflows?.filter((w) => w.status === "approved") || []
  const rejectedWorkflows = allWorkflows?.filter((w) => w.status === "rejected") || []

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Approval Workflows</h1>
        <p className="text-muted-foreground">Review and manage multi-level approval processes</p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pending Approvals</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{myApprovals?.length || 0}</div>
            <p className="text-xs text-muted-foreground">Require your action</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Pending</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingWorkflows.length}</div>
            <p className="text-xs text-muted-foreground">All workflows</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{approvedWorkflows.length}</div>
            <p className="text-xs text-muted-foreground">Completed workflows</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Rejected</CardTitle>
            <XCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{rejectedWorkflows.length}</div>
            <p className="text-xs text-muted-foreground">Declined workflows</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="mine" className="space-y-4">
        <TabsList>
          <TabsTrigger value="mine">My Approvals ({myApprovals?.length || 0})</TabsTrigger>
          <TabsTrigger value="all">All Workflows</TabsTrigger>
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="approved">Approved</TabsTrigger>
          <TabsTrigger value="rejected">Rejected</TabsTrigger>
        </TabsList>

        <TabsContent value="mine">
          <Card>
            <CardHeader>
              <CardTitle>Workflows Awaiting Your Approval</CardTitle>
              <CardDescription>Items that require your review and decision</CardDescription>
            </CardHeader>
            <CardContent>
              {myApprovals && myApprovals.length > 0 ? (
                <div className="space-y-3">
                  {myApprovals.map((approval: any) => (
                    <div
                      key={approval.id}
                      className="flex items-center justify-between border rounded-lg p-4 hover:bg-muted/50"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium">
                            {approval.workflow_id.entity_type.replace("_", " ").toUpperCase()}
                          </span>
                          <span className="text-sm text-muted-foreground">
                            Level {approval.level} of {approval.workflow_id.total_levels}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Submitted by {approval.workflow_id.submitted_by.full_name} •{" "}
                          {new Date(approval.workflow_id.submitted_at).toLocaleDateString()}
                        </p>
                      </div>
                      <Button asChild>
                        <Link href={`/dashboard/approvals/${approval.workflow_id.id}`}>Review</Link>
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8">
                  <CheckCircle2 className="h-12 w-12 text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">No pending approvals</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="all">
          <ApprovalWorkflowsTable workflows={allWorkflows || []} />
        </TabsContent>

        <TabsContent value="pending">
          <ApprovalWorkflowsTable workflows={pendingWorkflows} />
        </TabsContent>

        <TabsContent value="approved">
          <ApprovalWorkflowsTable workflows={approvedWorkflows} />
        </TabsContent>

        <TabsContent value="rejected">
          <ApprovalWorkflowsTable workflows={rejectedWorkflows} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

function Button({ asChild, children, ...props }: any) {
  return asChild ? children : <button {...props}>{children}</button>
}

function Link({ href, children }: any) {
  return (
    <a href={href} className="inline-flex items-center justify-center">
      {children}
    </a>
  )
}
