import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { hasPermission, getRoleLabel, getDepartmentLabel, getSubDepartmentLabel } from "@/lib/utils/permissions"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, UserCheck } from "lucide-react"

export default async function AdminApprovalsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

  if (!profile || !hasPermission(profile.role, "approveAccounts")) {
    redirect("/dashboard")
  }

  const { data: pendingUsers } = await supabase
    .from("profiles")
    .select("*")
    .eq("is_active", false)
    .order("created_at", { ascending: false })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <UserCheck className="h-8 w-8" />
          Account Approvals
        </h1>
        <p className="text-muted-foreground">Review and activate pending user accounts</p>
      </div>

      {pendingUsers && pendingUsers.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center py-12">
              <UserCheck className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium">No pending approvals</p>
              <p className="text-sm text-muted-foreground">All user accounts have been processed</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Account Activation Process</AlertTitle>
            <AlertDescription>
              Review each account and assign the appropriate role before activation. Users will receive an email
              notification once approved.
            </AlertDescription>
          </Alert>

          <div className="grid gap-4">
            {pendingUsers?.map((pendingUser) => (
              <Card key={pendingUser.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-xl">{pendingUser.full_name}</CardTitle>
                      <CardDescription>{pendingUser.email}</CardDescription>
                    </div>
                    <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                      Pending Approval
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <h4 className="text-sm font-medium mb-2">Account Details</h4>
                      <dl className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <dt className="text-muted-foreground">Requested Role:</dt>
                          <dd className="font-medium">{getRoleLabel(pendingUser.role)}</dd>
                        </div>
                        <div className="flex justify-between">
                          <dt className="text-muted-foreground">Department:</dt>
                          <dd className="font-medium">{getDepartmentLabel(pendingUser.department)}</dd>
                        </div>
                        {pendingUser.sub_department && (
                          <div className="flex justify-between">
                            <dt className="text-muted-foreground">Sub-Department:</dt>
                            <dd className="font-medium">{getSubDepartmentLabel(pendingUser.sub_department)}</dd>
                          </div>
                        )}
                        {pendingUser.phone && (
                          <div className="flex justify-between">
                            <dt className="text-muted-foreground">Phone:</dt>
                            <dd className="font-medium">{pendingUser.phone}</dd>
                          </div>
                        )}
                        <div className="flex justify-between">
                          <dt className="text-muted-foreground">Registered:</dt>
                          <dd className="font-medium">{new Date(pendingUser.created_at).toLocaleDateString()}</dd>
                        </div>
                      </dl>
                    </div>

                    <div className="flex flex-col justify-end">
                      <Button size="lg" className="w-full" asChild>
                        <Link href={`/dashboard/admin/approvals/${pendingUser.id}`}>Review & Activate Account</Link>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
