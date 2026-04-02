import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Lock, FileText, CheckCircle2, Download, Eye, Crown } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { canViewMDDashboard } from "@/lib/utils/permissions"

export default async function MDDashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

  // Only MANAGING_DIRECTOR (and BOOTSTRAP_ADMIN for system setup) may enter
  if (!profile || !canViewMDDashboard(profile.role)) {
    redirect("/dashboard")
  }

  // Fetch confidential audit reports
  const { data: confidentialReports } = await supabase
    .from("documents")
    .select("*, uploaded_by:uploaded_by(full_name, email), acknowledgements:md_acknowledgements(*)")
    .eq("report_type", "AUDIT_CONFIDENTIAL")
    .eq("confidential", true)
    .order("created_at", { ascending: false })

  // Fetch this MD's acknowledgements
  const { data: myAcknowledgements } = await supabase
    .from("md_acknowledgements")
    .select("*, document:document_id(*)")
    .eq("acknowledged_by", user.id)

  const unacknowledgedCount =
    confidentialReports?.filter((r: any) => !r.acknowledgements?.length).length ?? 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Lock className="h-8 w-8 text-amber-600" />
            Confidential Reports
          </h1>
          <p className="text-muted-foreground">Confidential audit reports, acknowledgements, and MD-only oversight</p>
        </div>
        <div className="flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1.5">
          <Lock className="h-3.5 w-3.5 text-amber-600" />
          <span className="text-xs font-medium text-amber-700 dark:text-amber-400">MD Restricted Access</span>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Confidential Reports</CardTitle>
            <Lock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{confidentialReports?.length ?? 0}</div>
            <p className="text-xs text-muted-foreground">From Audit department</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unacknowledged</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{unacknowledgedCount}</div>
            <p className="text-xs text-muted-foreground">Requiring review</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Acknowledged</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{myAcknowledgements?.length ?? 0}</div>
            <p className="text-xs text-muted-foreground">Reports reviewed</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Access Level</CardTitle>
            <Crown className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">MD Only</div>
            <p className="text-xs text-muted-foreground">Confidential access</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="confidential" className="space-y-4">
        <TabsList>
          <TabsTrigger value="confidential">Confidential Audit Reports</TabsTrigger>
          <TabsTrigger value="acknowledged">Acknowledged</TabsTrigger>
        </TabsList>

        <TabsContent value="confidential" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Confidential Audit Reports</CardTitle>
              <CardDescription>Reports visible only to the Managing Director</CardDescription>
            </CardHeader>
            <CardContent>
              {confidentialReports?.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No confidential reports submitted yet</p>
              ) : (
                <div className="space-y-4">
                  {confidentialReports?.map((doc: any) => {
                    const isAcknowledged = doc.acknowledgements?.length > 0
                    return (
                      <div
                        key={doc.id}
                        className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0"
                      >
                        <div className="space-y-1 flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-medium">{doc.title}</p>
                            {isAcknowledged ? (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                <CheckCircle2 className="h-3 w-3 mr-1" />
                                Acknowledged
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                Pending Review
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">{doc.description}</p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span>From: {doc.uploaded_by?.full_name}</span>
                            <span>•</span>
                            <span>{new Date(doc.created_at).toLocaleString()}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button size="sm" variant="outline" asChild>
                            <Link href={`/dashboard/md/reports/${doc.id}`}>
                              <Eye className="h-4 w-4 mr-1" />
                              View
                            </Link>
                          </Button>
                          <Button size="sm" variant="outline">
                            <Download className="h-4 w-4 mr-1" />
                            Download
                          </Button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="acknowledged" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Acknowledged Reports</CardTitle>
              <CardDescription>Reports you have reviewed and acknowledged</CardDescription>
            </CardHeader>
            <CardContent>
              {myAcknowledgements?.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No acknowledgements yet</p>
              ) : (
                <div className="space-y-4">
                  {myAcknowledgements?.map((ack: any) => (
                    <div key={ack.id} className="flex items-start gap-4 border-b pb-4 last:border-0">
                      <div className="rounded-full bg-primary/10 p-2">
                        <CheckCircle2 className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1 space-y-1">
                        <p className="font-medium">{ack.document?.title}</p>
                        <p className="text-sm text-muted-foreground">{ack.acknowledgement_type}</p>
                        <p className="text-xs text-muted-foreground">
                          Acknowledged: {new Date(ack.acknowledged_at).toLocaleString()}
                        </p>
                        {ack.notes && <p className="text-sm italic">"{ack.notes}"</p>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}