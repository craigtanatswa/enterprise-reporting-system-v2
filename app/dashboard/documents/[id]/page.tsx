import type React from "react"
import { createClient } from "@/lib/supabase/server"
import { redirect, notFound } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { ArrowLeft, Download, Edit, Archive, FileText, Calendar, User, Building, Tag, CheckCircle2 } from "lucide-react"
import Link from "next/link"
import { getDepartmentLabel } from "@/lib/utils/permissions"
import { DOCUMENT_STATUSES } from "@/lib/utils/dashboard-routing"

const STATUS_ORDER = ["draft", "submitted", "returned_with_comments", "reviewed_no_comments", "approved"]

export default async function DocumentDetailPage({
  params,
  searchParams,
}: {
  params: { id: string }
  searchParams: Promise<{ returnTo?: string; from?: string }>
}) {
  const { returnTo, from } = await searchParams
  const backHref = returnTo || (from === "md" ? "/dashboard/md/reports" : "/dashboard/documents")

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()
  const isAuditor = profile?.role === "AUDITOR"

  // Fetch document with uploader and reviewer info
  const { data: document } = await supabase
    .from("documents")
    .select("*, uploaded_by(full_name, email), approved_by(full_name), reviewed_by:reviewed_by(full_name)")
    .eq("id", params.id)
    .single()

  if (!document) {
    notFound()
  }

  // Re-check isReadOnly after we have document
  const docReadOnly = document.status !== "draft" || profile?.role === "AUDITOR"

  // Fetch document versions
  const { data: versions } = await supabase
    .from("document_versions")
    .select("*, uploaded_by(full_name)")
    .eq("document_id", params.id)
    .order("version", { ascending: false })

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const getStatusVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
    const config = DOCUMENT_STATUSES.find((s) => s.value === status)
    return (config?.color as any) || "outline"
  }

  const statusIndex = STATUS_ORDER.indexOf(document.status)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href={backHref}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{document.title}</h1>
            <p className="text-muted-foreground">{document.description || "No description provided"}</p>
          </div>
        </div>
        <div className="flex gap-2">
          {document.file_url && (
            <Button variant="outline" asChild>
              <a href={document.file_url} download={document.file_name}>
                <Download className="mr-2 h-4 w-4" />
                Download
              </a>
            </Button>
          )}
          {docReadOnly && (
            <Badge variant="outline" className="self-center">
              Read-only (submitted)
            </Badge>
          )}
          {!docReadOnly && !isAuditor && (
            <>
              <Button variant="outline" disabled title="Edit not yet implemented">
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </Button>
              <Button variant="outline" disabled title="Archive not yet implemented">
                <Archive className="mr-2 h-4 w-4" />
                Archive
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Status Timeline */}
      <Card>
        <CardHeader>
          <CardTitle>Status Timeline</CardTitle>
          <CardDescription>Document workflow progress</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 flex-wrap">
            {STATUS_ORDER.map((status, idx) => {
              const isActive = idx <= statusIndex
              const label = DOCUMENT_STATUSES.find((s) => s.value === status)?.label || status.replace(/_/g, " ")
              return (
                <div key={status} className="flex items-center gap-2">
                  <div
                    className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-sm ${
                      isActive ? "bg-primary/10 text-primary font-medium" : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {isActive && <CheckCircle2 className="h-3.5 w-3.5" />}
                    {label}
                  </div>
                  {idx < STATUS_ORDER.length - 1 && (
                    <span className="text-muted-foreground">→</span>
                  )}
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Document Preview */}
      {document.file_url && (
        <Card>
          <CardHeader>
            <CardTitle>Document Preview</CardTitle>
            <CardDescription>Embedded view of the uploaded file</CardDescription>
          </CardHeader>
          <CardContent>
            {document.file_type?.includes("pdf") ? (
              <iframe
                src={document.file_url}
                className="w-full h-[600px] border rounded-md"
                title="Document preview"
              />
            ) : (
              <div className="flex flex-col items-center justify-center py-12 border rounded-md bg-muted/30">
                <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-sm text-muted-foreground mb-2">
                  Preview not available for this file type
                </p>
                <Button variant="outline" asChild>
                  <a href={document.file_url} download={document.file_name}>
                    <Download className="mr-2 h-4 w-4" />
                    Download to view
                  </a>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 md:grid-cols-3">
        {/* Document Details */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Document Details</CardTitle>
            <CardDescription>Information about this document</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <FileText className="h-4 w-4" />
                  <span>File Name</span>
                </div>
                <p className="font-medium">{document.file_name}</p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <FileText className="h-4 w-4" />
                  <span>File Size</span>
                </div>
                <p className="font-medium">{formatFileSize(document.file_size)}</p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <User className="h-4 w-4" />
                  <span>Uploaded By</span>
                </div>
                <p className="font-medium">{document.uploaded_by?.full_name || "Unknown"}</p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>Upload Date</span>
                </div>
                <p className="font-medium">{new Date(document.created_at).toLocaleDateString()}</p>
              </div>

              {document.reporting_period && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>Reporting Period</span>
                  </div>
                  <p className="font-medium">{document.reporting_period}</p>
                </div>
              )}

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Building className="h-4 w-4" />
                  <span>Department</span>
                </div>
                <p className="font-medium">{getDepartmentLabel(document.department)}</p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <FileText className="h-4 w-4" />
                  <span>Version</span>
                </div>
                <p className="font-medium">v{document.version}</p>
              </div>
            </div>

            <Separator />

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Tag className="h-4 w-4" />
                <span>Tags</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {document.tags && document.tags.length > 0 ? (
                  document.tags.map((tag: string, index: number) => (
                    <Badge key={index} variant="outline">
                      {tag}
                    </Badge>
                  ))
                ) : (
                  <span className="text-sm text-muted-foreground">No tags</span>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Status & Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Status</CardTitle>
            <CardDescription>Current document status</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-sm text-muted-foreground">Status</Label>
              <div className="mt-1">
                <Badge variant={getStatusVariant(document.status)}>
                  {DOCUMENT_STATUSES.find((s) => s.value === document.status)?.label || document.status.replace(/_/g, " ")}
                </Badge>
              </div>
            </div>

            <div>
              <Label className="text-sm text-muted-foreground">Category</Label>
              <div className="mt-1">
                <Badge variant="outline">{(document.category || "").replace(/_/g, " ")}</Badge>
              </div>
            </div>

            {document.reviewed_by && (
              <>
                <Separator />
                <div>
                  <Label className="text-sm text-muted-foreground">Current Reviewer</Label>
                  <p className="mt-1 font-medium">
                    {(document.reviewed_by as { full_name?: string } | null)?.full_name || "—"}
                  </p>
                </div>
              </>
            )}

            {document.approved_by && (
              <>
                <Separator />
                <div>
                  <Label className="text-sm text-muted-foreground">Approved By</Label>
                  <p className="mt-1 font-medium">{document.approved_by.full_name}</p>
                  <p className="text-xs text-muted-foreground">
                    {document.approved_at ? new Date(document.approved_at).toLocaleDateString() : "N/A"}
                  </p>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Version History */}
      {versions && versions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Version History</CardTitle>
            <CardDescription>Previous versions of this document</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {versions.map((version) => (
                <div key={version.id} className="flex items-center justify-between border-b pb-4 last:border-0">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">v{version.version}</Badge>
                      <span className="font-medium">{version.file_name}</span>
                    </div>
                    {version.changes_description && (
                      <p className="mt-1 text-sm text-muted-foreground">{version.changes_description}</p>
                    )}
                    <p className="mt-1 text-xs text-muted-foreground">
                      Uploaded by {version.uploaded_by?.full_name} on{" "}
                      {new Date(version.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <Button variant="ghost" size="sm">
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function Label({ className, children }: { className?: string; children: React.ReactNode }) {
  return <label className={className}>{children}</label>
}
