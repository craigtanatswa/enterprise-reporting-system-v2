import { createClient } from "@/lib/supabase/server"
import { redirect, notFound } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ArrowLeft, CheckCircle2, XCircle, Clock, User } from "lucide-react"
import Link from "next/link"
import { ApprovalActions } from "@/components/approvals/approval-actions"
import { ApprovalTimeline } from "@/components/approvals/approval-timeline"

export default async function ApprovalDetailPage({ params }: { params: { id: string } }) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()

  // Fetch workflow with details
  const { data: workflow } = await supabase
    .from("approval_workflows")
    .select("*, submitted_by(full_name, email, department)")
    .eq("id", params.id)
    .single()

  if (!workflow) {
    notFound()
  }

  // Fetch approval steps
  const { data: steps } = await supabase
    .from("approval_steps")
    .select("*, approver_id(full_name, email)")
    .eq("workflow_id", params.id)
    .order("level", { ascending: true })

  // Check if current user can approve
  const currentStep = steps?.find((s) => s.level === workflow.current_level && s.status === "pending")
  const canApprove =
    currentStep &&
    (currentStep.approver_id === user.id || currentStep.approver_role === profile?.role) &&
    workflow.status === "pending"

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "pending":
        return "default"
      case "approved":
        return "default"
      case "rejected":
        return "destructive"
      default:
        return "outline"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="h-5 w-5 text-muted-foreground" />
      case "approved":
        return <CheckCircle2 className="h-5 w-5 text-green-500" />
      case "rejected":
        return <XCircle className="h-5 w-5 text-destructive" />
      default:
        return null
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/dashboard/approvals"
          className="inline-flex items-center justify-center h-10 w-10 rounded-md border hover:bg-accent"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Approval Workflow</h1>
          <p className="text-muted-foreground">{workflow.entity_type.replace("_", " ").toUpperCase()}</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Workflow Details</CardTitle>
            <CardDescription>Information about this approval request</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <User className="h-4 w-4" />
                  <span>Submitted By</span>
                </div>
                <p className="font-medium">{workflow.submitted_by?.full_name}</p>
                <p className="text-sm text-muted-foreground">{workflow.submitted_by?.email}</p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>Submitted At</span>
                </div>
                <p className="font-medium">{new Date(workflow.submitted_at).toLocaleDateString()}</p>
                <p className="text-sm text-muted-foreground">{new Date(workflow.submitted_at).toLocaleTimeString()}</p>
              </div>

              <div className="space-y-2">
                <span className="text-sm text-muted-foreground">Department</span>
                <p className="font-medium">{workflow.submitted_by?.department}</p>
              </div>

              <div className="space-y-2">
                <span className="text-sm text-muted-foreground">Approval Progress</span>
                <p className="font-medium">
                  Level {workflow.current_level} of {workflow.total_levels}
                </p>
              </div>
            </div>

            <Separator />

            <ApprovalTimeline steps={steps || []} currentLevel={workflow.current_level} />
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Status</CardTitle>
              <CardDescription>Current workflow status</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                {getStatusIcon(workflow.status)}
                <Badge variant={getStatusVariant(workflow.status)} className="text-sm">
                  {workflow.status.replace("_", " ")}
                </Badge>
              </div>

              {workflow.completed_at && (
                <>
                  <Separator />
                  <div>
                    <span className="text-sm text-muted-foreground">Completed At</span>
                    <p className="mt-1 font-medium">{new Date(workflow.completed_at).toLocaleDateString()}</p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {canApprove && (
            <ApprovalActions workflowId={workflow.id} stepId={currentStep.id} entityType={workflow.entity_type} />
          )}
        </div>
      </div>
    </div>
  )
}
