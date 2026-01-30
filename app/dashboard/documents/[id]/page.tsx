import type React from "react"
import { createClient } from "@/lib/supabase/server"
import { redirect, notFound } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { ArrowLeft, Download, Edit, Archive, FileText, Calendar, User, Building, Tag } from "lucide-react"
import Link from "next/link"
import { getDepartmentLabel } from "@/lib/utils/permissions"

export default async function DocumentDetailPage({ params }: { params: { id: string } }) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Fetch document with uploader info
  const { data: document } = await supabase
    .from("documents")
    .select("*, uploaded_by(full_name, email), approved_by(full_name)")
    .eq("id", params.id)
    .single()

  if (!document) {
    notFound()
  }

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

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "draft":
        return "secondary"
      case "pending_approval":
        return "default"
      case "approved":
        return "default"
      case "rejected":
        return "destructive"
      case "archived":
        return "outline"
      default:
        return "outline"
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard/documents">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{document.title}</h1>
            <p className="text-muted-foreground">{document.description || "No description provided"}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Download
          </Button>
          <Button variant="outline">
            <Edit className="mr-2 h-4 w-4" />
            Edit
          </Button>
          <Button variant="outline">
            <Archive className="mr-2 h-4 w-4" />
            Archive
          </Button>
        </div>
      </div>

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
                <Badge variant={getStatusVariant(document.status)}>{document.status.replace("_", " ")}</Badge>
              </div>
            </div>

            <div>
              <Label className="text-sm text-muted-foreground">Category</Label>
              <div className="mt-1">
                <Badge variant="outline">{document.category}</Badge>
              </div>
            </div>

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
