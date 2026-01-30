import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { canViewConfidentialReports } from "@/lib/utils/permissions"
import { Lock, Download, CheckCircle2, FileText, User, Calendar } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default async function MDReportDetailPage({ params }: { params: { id: string } }) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

  if (!profile || !canViewConfidentialReports(profile.role)) {
    redirect("/dashboard")
  }

  const { data: document } = await supabase
    .from("documents")
    .select("*, uploaded_by:uploaded_by(full_name, email), acknowledgements:md_acknowledgements(*)")
    .eq("id", params.id)
    .single()

  if (!document || document.report_type !== "AUDIT_CONFIDENTIAL") {
    redirect("/dashboard/md")
  }

  const isAcknowledged = document.acknowledgements?.some((ack: any) => ack.acknowledged_by === user.id)

  // Fetch access log for this document
  const { data: accessLog } = await supabase
    .from("document_access_log")
    .select("*, accessed_by:accessed_by(full_name, role)")
    .eq("document_id", params.id)
    .order("accessed_at", { ascending: false })
    .limit(10)

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Lock className="h-8 w-8 text-primary" />
            {document.title}
          </h1>
          <p className="text-muted-foreground">Confidential Audit Report</p>
        </div>
        <div className="flex items-center gap-2">
          {isAcknowledged ? (
            <Badge variant="default" className="gap-1">
              <CheckCircle2 className="h-3 w-3" />
              Acknowledged
            </Badge>
          ) : (
            <Badge variant="destructive">Pending Review</Badge>
          )}
        </div>
      </div>

      <Alert variant="destructive">
        <Lock className="h-4 w-4" />
        <AlertTitle>Confidential - Managing Director Only</AlertTitle>
        <AlertDescription>
          This document is marked as confidential and is visible only to you. All access to this document is logged for
          audit compliance.
        </AlertDescription>
      </Alert>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Report Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Submitted By
                </Label>
                <p className="text-sm font-medium">{document.uploaded_by?.full_name}</p>
                <p className="text-xs text-muted-foreground">{document.uploaded_by?.email}</p>
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Submission Date
                </Label>
                <p className="text-sm">{new Date(document.created_at).toLocaleString()}</p>
              </div>

              <div className="space-y-2">
                <Label>Report Type</Label>
                <Badge variant="destructive">{document.report_type}</Badge>
              </div>

              <div className="space-y-2">
                <Label>File Type</Label>
                <Badge variant="outline">{document.file_type.toUpperCase()}</Badge>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <p className="text-sm">{document.description}</p>
            </div>

            <div className="space-y-2">
              <Label>Document</Label>
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                <span className="text-sm font-medium">{document.file_name}</span>
                <span className="text-xs text-muted-foreground">
                  ({(document.file_size / 1024 / 1024).toFixed(2)} MB)
                </span>
              </div>
            </div>

            <Button className="w-full">
              <Download className="h-4 w-4 mr-2" />
              Download Report
            </Button>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Acknowledgement</CardTitle>
              <CardDescription>Mark this report as reviewed</CardDescription>
            </CardHeader>
            <CardContent>
              {isAcknowledged ? (
                <div className="space-y-4">
                  <Alert>
                    <CheckCircle2 className="h-4 w-4" />
                    <AlertTitle>Already Acknowledged</AlertTitle>
                    <AlertDescription>
                      You acknowledged this report on{" "}
                      {new Date(document.acknowledgements[0]?.acknowledged_at).toLocaleDateString()}
                    </AlertDescription>
                  </Alert>
                </div>
              ) : (
                <form className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="ack-type">Acknowledgement Type</Label>
                    <Select name="ack-type" defaultValue="read">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="read">Read</SelectItem>
                        <SelectItem value="reviewed">Reviewed</SelectItem>
                        <SelectItem value="action_taken">Action Taken</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="notes">Notes (Optional)</Label>
                    <Textarea id="notes" name="notes" rows={3} placeholder="Add any notes or comments..." />
                  </div>

                  <Button type="submit" className="w-full">
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Acknowledge Report
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Access Log</CardTitle>
              <CardDescription>Recent access history</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {accessLog?.slice(0, 5).map((log: any) => (
                  <div key={log.id} className="text-sm space-y-1">
                    <p className="font-medium">{log.accessed_by?.full_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {log.access_type} • {new Date(log.accessed_at).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
