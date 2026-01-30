import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DocumentsTable } from "@/components/documents/documents-table"
import { Upload, Filter } from "lucide-react"
import Link from "next/link"

export default async function DocumentsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const { data: profile } = await supabase.from("profiles").select("role, department").eq("id", user.id).single()

  const canViewAll = profile?.role === "md" || profile?.role === "admin"

  // Fetch documents based on role
  let documentsQuery = supabase.from("documents").select("*, uploaded_by(full_name), approved_by(full_name)")

  if (!canViewAll) {
    documentsQuery = documentsQuery.eq("department", profile?.department)
  }

  const { data: documents } = await documentsQuery.order("created_at", { ascending: false })

  // Group by status
  const draftDocs = documents?.filter((d) => d.status === "draft") || []
  const pendingDocs = documents?.filter((d) => d.status === "pending_approval") || []
  const approvedDocs = documents?.filter((d) => d.status === "approved") || []
  const rejectedDocs = documents?.filter((d) => d.status === "rejected") || []
  const archivedDocs = documents?.filter((d) => d.status === "archived") || []

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Document Repository</h1>
          <p className="text-muted-foreground">Manage and organize your documents with version control</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="icon">
            <Filter className="h-4 w-4" />
          </Button>
          <Button asChild>
            <Link href="/dashboard/documents/upload">
              <Upload className="mr-2 h-4 w-4" />
              Upload Document
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Documents</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{documents?.length || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Drafts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{draftDocs.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingDocs.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{approvedDocs.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Archived</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{archivedDocs.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Documents Tabs */}
      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">All Documents</TabsTrigger>
          <TabsTrigger value="draft">Drafts</TabsTrigger>
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="approved">Approved</TabsTrigger>
          <TabsTrigger value="archived">Archived</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          <DocumentsTable documents={documents || []} />
        </TabsContent>

        <TabsContent value="draft" className="space-y-4">
          <DocumentsTable documents={draftDocs} />
        </TabsContent>

        <TabsContent value="pending" className="space-y-4">
          <DocumentsTable documents={pendingDocs} />
        </TabsContent>

        <TabsContent value="approved" className="space-y-4">
          <DocumentsTable documents={approvedDocs} />
        </TabsContent>

        <TabsContent value="archived" className="space-y-4">
          <DocumentsTable documents={archivedDocs} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
