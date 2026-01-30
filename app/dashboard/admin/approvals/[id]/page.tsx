import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { getRoleLabel, getDepartmentLabel, canApproveAccounts } from "@/lib/utils/permissions"
import { AlertTriangle, CheckCircle2, Shield } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Label } from "@/components/ui/label"
import { ApprovalForm } from "@/components/admin/approval-form"

export default async function ApprovalDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

  if (!profile || !canApproveAccounts(profile.role)) {
    redirect("/dashboard")
  }

  const { id } = await params

  const { data: pendingUser } = await supabase.from("profiles").select("*").eq("id", id).single()

  if (!pendingUser) {
    redirect("/dashboard/admin")
  }

  const initials = pendingUser.full_name
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Account Approval Review</h1>
        <p className="text-muted-foreground">Review and approve user account for activation</p>
      </div>

      {!pendingUser.is_active && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Pending Approval Required</AlertTitle>
          <AlertDescription>
            This account requires administrative approval before the user can access the system. Please review the
            details carefully before approving.
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>User Information</CardTitle>
          <CardDescription>Account details and role assignment</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarFallback className="text-xl">{initials}</AvatarFallback>
            </Avatar>
            <div className="space-y-1">
              <p className="text-xl font-semibold">{pendingUser.full_name}</p>
              <p className="text-muted-foreground">{pendingUser.email}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Role</Label>
              <div>
                <Badge variant="outline" className="text-base px-3 py-1">
                  {getRoleLabel(pendingUser.role)}
                </Badge>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Department</Label>
              <div>
                <Badge variant="secondary" className="text-base px-3 py-1">
                  {getDepartmentLabel(pendingUser.department)}
                </Badge>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Phone</Label>
              <p className="text-sm">{pendingUser.phone || "Not provided"}</p>
            </div>

            <div className="space-y-2">
              <Label>Registration Date</Label>
              <p className="text-sm">{new Date(pendingUser.created_at).toLocaleString()}</p>
            </div>

            <div className="space-y-2">
              <Label>Account Status</Label>
              <Badge variant={pendingUser.is_active ? "default" : "secondary"}>
                {pendingUser.is_active ? "Active" : "Pending Approval"}
              </Badge>
            </div>
          </div>

          {pendingUser.role === "AUDITOR" && (
            <Alert>
              <Shield className="h-4 w-4" />
              <AlertTitle>Auditor Account</AlertTitle>
              <AlertDescription>
                This user will have oversight access to all departments and documents (read-only). They can submit
                confidential audit reports visible only to the Managing Director.
              </AlertDescription>
            </Alert>
          )}

          {pendingUser.role === "MANAGING_DIRECTOR" && (
            <Alert>
              <Shield className="h-4 w-4" />
              <AlertTitle>Managing Director Account</AlertTitle>
              <AlertDescription>
                This user will have access to confidential audit reports and full system visibility. Only one MD should
                exist at a time.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {!pendingUser.is_active && <ApprovalForm userId={pendingUser.id} currentRole={pendingUser.role} />}

      {pendingUser.is_active && (
        <Alert>
          <CheckCircle2 className="h-4 w-4" />
          <AlertTitle>Account Already Active</AlertTitle>
          <AlertDescription>This account has already been approved and activated.</AlertDescription>
        </Alert>
      )}
    </div>
  )
}
