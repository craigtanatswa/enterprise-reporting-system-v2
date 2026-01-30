import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { AlertTriangle, Lock } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export default async function ConfidentialReportPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

  if (!profile || profile.role !== "AUDITOR") {
    redirect("/dashboard")
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <Lock className="h-8 w-8 text-primary" />
          Submit Confidential Audit Report
        </h1>
        <p className="text-muted-foreground">Confidential report visible only to Managing Director</p>
      </div>

      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Confidential Report</AlertTitle>
        <AlertDescription>
          This report will be marked as AUDIT_CONFIDENTIAL and will be visible ONLY to the Managing Director and
          Bootstrap Admin. It cannot be viewed by operational departments, standard admins, or other users.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle>Report Details</CardTitle>
          <CardDescription>All fields are required for confidential audit submissions</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">Report Title *</Label>
              <Input id="title" name="title" required placeholder="e.g., Q4 Compliance Audit Findings" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Executive Summary *</Label>
              <Textarea
                id="description"
                name="description"
                required
                rows={4}
                placeholder="Provide a high-level summary of the audit findings..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="file">Upload Report Document *</Label>
              <Input id="file" name="file" type="file" required accept=".pdf,.docx,.xlsx" />
              <p className="text-sm text-muted-foreground">Accepted formats: PDF, DOCX, XLSX (Max 50MB)</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="findings">Key Findings *</Label>
              <Textarea
                id="findings"
                name="findings"
                required
                rows={6}
                placeholder="Summarize critical findings, risks identified, and recommendations..."
              />
            </div>

            <Alert>
              <Lock className="h-4 w-4" />
              <AlertTitle>Security Notice</AlertTitle>
              <AlertDescription>
                By submitting this report, you confirm that:
                <ul className="list-disc ml-6 mt-2 space-y-1">
                  <li>The information is accurate and verified</li>
                  <li>The report should remain confidential to the Managing Director</li>
                  <li>The submission will be logged in the immutable audit trail</li>
                  <li>You cannot edit or delete this report after submission</li>
                </ul>
              </AlertDescription>
            </Alert>

            <div className="flex gap-4">
              <Button type="submit" className="flex-1">
                <Lock className="h-4 w-4 mr-2" />
                Submit Confidential Report
              </Button>
              <Button type="button" variant="outline" asChild>
                <a href="/dashboard/audit">Cancel</a>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
