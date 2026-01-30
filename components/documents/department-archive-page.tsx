import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Archive, Eye, Download } from "lucide-react"
import Link from "next/link"

interface DepartmentArchivePageProps {
  department: string
  departmentLabel: string
  basePath: string
}

export async function DepartmentArchivePage({ 
  department, 
  departmentLabel,
  basePath 
}: DepartmentArchivePageProps) {
  const supabase = await createClient()

  // Fetch approved/archived documents with version history
  const { data: archivedDocs } = await supabase
    .from("documents")
    .select("*, uploaded_by:uploaded_by(full_name), versions:document_versions(*)")
    .eq("department", department)
    .in("status", ["approved", "archived"])
    .order("created_at", { ascending: false })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <Archive className="h-8 w-8" />
          {departmentLabel} Archive
        </h1>
        <p className="text-muted-foreground">
          Historical record of approved and archived documents
        </p>
      </div>

      {/* Archive Table */}
      <Card>
        <CardHeader>
          <CardTitle>Document Archive</CardTitle>
          <CardDescription>
            All approved documents are preserved here for audit and compliance purposes
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!archivedDocs || archivedDocs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="rounded-full bg-muted p-4 mb-4">
                <Archive className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium mb-2">No archived documents</h3>
              <p className="text-sm text-muted-foreground">
                Approved documents will appear here for historical reference.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Document Title</TableHead>
                  <TableHead>Reporting Period</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Versions</TableHead>
                  <TableHead>Approved Date</TableHead>
                  <TableHead>Uploaded By</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {archivedDocs.map((doc) => (
                  <TableRow key={doc.id}>
                    <TableCell>
                      <div className="font-medium">{doc.title}</div>
                    </TableCell>
                    <TableCell>{doc.reporting_period || "-"}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">
                        {(doc.category || "other").replace(/_/g, " ")}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        v{doc.version || 1}
                        {doc.versions && doc.versions.length > 0 && ` (${doc.versions.length} total)`}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {doc.approved_at 
                        ? new Date(doc.approved_at).toLocaleDateString() 
                        : new Date(doc.updated_at || doc.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>{doc.uploaded_by?.full_name || "Unknown"}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" asChild>
                          <Link href={`${basePath}/documents/${doc.id}`}>
                            <Eye className="h-4 w-4" />
                          </Link>
                        </Button>
                        <Button variant="ghost" size="icon">
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
