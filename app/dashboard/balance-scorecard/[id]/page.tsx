import { createClient } from "@/lib/supabase/server"
import { redirect, notFound } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Download, Lock, CheckCircle, XCircle, Clock } from "lucide-react"
import Link from "next/link"
import { canViewConfidentialReports } from "@/lib/utils/permissions"
import { BalanceScorecardApprovalForm } from "@/components/balance-scorecard/approval-form"

export default async function BalanceScorecardDetailPage({ params }: { params: { id: string } }) {
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

  const { id } = await params

  // Fetch the scorecard
  const { data: scorecard, error } = await supabase
    .from("balance_scorecards")
    .select("*, user:profiles!balance_scorecards_user_id_fkey(full_name, department)")
    .eq("id", id)
    .single()

  if (error || !scorecard) {
    notFound()
  }

  // Check permissions - user can view their own, MD can view all
  const isMD = canViewConfidentialReports(profile.role)
  const isOwner = scorecard.user_id === user.id

  if (!isOwner && !isMD) {
    redirect("/dashboard/balance-scorecard")
  }

  const canApprove = isMD && scorecard.status === "pending_approval"

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Balance Scorecard Q{scorecard.quarter} {scorecard.year}
          </h1>
          <p className="text-muted-foreground">Submitted by {scorecard.user?.full_name}</p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/dashboard/balance-scorecard">Back to Overview</Link>
        </Button>
      </div>

      {/* Status Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Scorecard Status
            {scorecard.is_locked && (
              <Badge variant="outline" className="flex items-center gap-1">
                <Lock className="h-3 w-3" />
                Locked
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            {scorecard.status === "approved" && <CheckCircle className="h-5 w-5 text-green-600" />}
            {scorecard.status === "pending_approval" && <Clock className="h-5 w-5 text-yellow-600" />}
            {scorecard.status === "rejected" && <XCircle className="h-5 w-5 text-red-600" />}
            <Badge
              variant={
                scorecard.status === "approved" ? "default" : scorecard.status === "rejected" ? "destructive" : "secondary"
              }
            >
              {scorecard.status.replace("_", " ")}
            </Badge>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-sm text-muted-foreground">Submitted</p>
              <p className="font-medium">
                {scorecard.submitted_at ? new Date(scorecard.submitted_at).toLocaleString() : "Draft"}
              </p>
            </div>
            {scorecard.approved_at && (
              <div>
                <p className="text-sm text-muted-foreground">Approved</p>
                <p className="font-medium">{new Date(scorecard.approved_at).toLocaleString()}</p>
              </div>
            )}
          </div>

          {scorecard.notes && (
            <div>
              <p className="text-sm text-muted-foreground">Submitter Notes</p>
              <p className="mt-1 text-sm">{scorecard.notes}</p>
            </div>
          )}

          {scorecard.approval_notes && (
            <div>
              <p className="text-sm text-muted-foreground">MD Comments</p>
              <p className="mt-1 text-sm">{scorecard.approval_notes}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* File Download */}
      <Card>
        <CardHeader>
          <CardTitle>Scorecard Document</CardTitle>
          <CardDescription>Download the submitted balance scorecard file</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">{scorecard.file_name}</p>
              <p className="text-xs text-muted-foreground">Uploaded {new Date(scorecard.created_at).toLocaleString()}</p>
            </div>
            <Button variant="outline" asChild>
              <a href={scorecard.file_url} target="_blank" rel="noopener noreferrer" download>
                <Download className="mr-2 h-4 w-4" />
                Download
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Approval Form (MD only) */}
      {canApprove && (
        <Card>
          <CardHeader>
            <CardTitle>MD Approval</CardTitle>
            <CardDescription>Review and approve or reject this balance scorecard</CardDescription>
          </CardHeader>
          <CardContent>
            <BalanceScorecardApprovalForm scorecardId={scorecard.id} />
          </CardContent>
        </Card>
      )}
    </div>
  )
}
