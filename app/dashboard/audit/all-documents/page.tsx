"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Download, Eye, Search, Filter, RefreshCw, Shield } from "lucide-react"
import { format } from "date-fns"
import Link from "next/link"
import { getDepartmentLabel } from "@/lib/utils/permissions"
import { DOCUMENT_STATUSES } from "@/lib/utils/dashboard-routing"
import { useSearchParams } from "next/navigation"
import { Suspense } from "react"

interface Document {
  id: string
  title: string
  description: string | null
  category: string
  status: string
  department: string
  sub_department: string | null
  file_name: string
  file_url: string | null
  created_at: string
  updated_at: string
  reporting_period: string | null
  uploaded_by: {
    full_name: string
    email: string
  } | null
}

const Loading = () => null

export default function AuditAllDocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [departmentFilter, setDepartmentFilter] = useState<string>("all")
  const [categoryFilter, setCategoryFilter] = useState<string>("all")
  const searchParams = useSearchParams()

  useEffect(() => {
    fetchDocuments()
  }, [])

  async function fetchDocuments() {
    setLoading(true)
    const { data, error } = await supabase
      .from("documents")
      .select(`
        id,
        title,
        description,
        category,
        status,
        department,
        sub_department,
        file_name,
        file_url,
        created_at,
        updated_at,
        reporting_period,
        uploaded_by:profiles!documents_uploaded_by_fkey(full_name, email)
      `)
      .order("created_at", { ascending: false })

    if (!error && data) {
      setDocuments(data as Document[])
    }
    setLoading(false)
  }

  const filteredDocuments = documents.filter((doc) => {
    const matchesSearch =
      doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.description?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesDepartment = departmentFilter === "all" || doc.department === departmentFilter
    const matchesCategory = categoryFilter === "all" || doc.category === categoryFilter
    return matchesSearch && matchesDepartment && matchesCategory
  })

  const getStatusBadge = (status: string) => {
    const statusConfig = DOCUMENT_STATUSES.find((s) => s.value === status)
    return (
      <Badge variant={statusConfig?.color as "default" | "secondary" | "destructive" | "outline"}>
        {statusConfig?.label || status}
      </Badge>
    )
  }

  const departments = [...new Set(documents.map((d) => d.department))].filter(Boolean)
  const categories = [...new Set(documents.map((d) => d.category))].filter(Boolean)

  return (
    <Suspense fallback={<Loading />}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Shield className="h-6 w-6" />
              Audit - All Documents
            </h1>
            <p className="text-muted-foreground">Read-only access to all department documents for audit purposes</p>
          </div>
          <Button variant="outline" onClick={fetchDocuments} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Filter className="h-4 w-4" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              <div className="flex-1 min-w-[200px]">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search documents..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>
              <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Department" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Departments</SelectItem>
                  {departments.map((dept) => (
                    <SelectItem key={dept} value={dept}>
                      {getDepartmentLabel(dept as any)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat.replace(/_/g, " ")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Stats by Department */}
        <div className="grid gap-4 md:grid-cols-5">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Documents</CardDescription>
              <CardTitle className="text-2xl">{filteredDocuments.length}</CardTitle>
            </CardHeader>
          </Card>
          {departments.slice(0, 4).map((dept) => (
            <Card key={dept}>
              <CardHeader className="pb-2">
                <CardDescription className="truncate">{getDepartmentLabel(dept as any)}</CardDescription>
                <CardTitle className="text-2xl">
                  {filteredDocuments.filter((d) => d.department === dept).length}
                </CardTitle>
              </CardHeader>
            </Card>
          ))}
        </div>

        {/* Documents Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Department Documents</CardTitle>
            <CardDescription>
              Showing {filteredDocuments.length} documents across all departments
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Period</TableHead>
                  <TableHead>Uploaded By</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      Loading documents...
                    </TableCell>
                  </TableRow>
                ) : filteredDocuments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      No documents found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredDocuments.map((doc) => (
                    <TableRow key={doc.id}>
                      <TableCell className="font-medium max-w-[200px] truncate">{doc.title}</TableCell>
                      <TableCell>
                        {getDepartmentLabel(doc.department as any)}
                        {doc.sub_department && (
                          <span className="text-muted-foreground text-xs block">{doc.sub_department}</span>
                        )}
                      </TableCell>
                      <TableCell className="capitalize">{doc.category?.replace(/_/g, " ")}</TableCell>
                      <TableCell>{doc.reporting_period || "-"}</TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {doc.uploaded_by?.full_name || "Unknown"}
                          <span className="text-muted-foreground text-xs block">{doc.uploaded_by?.email}</span>
                        </div>
                      </TableCell>
                      <TableCell>{format(new Date(doc.created_at), "MMM d, yyyy")}</TableCell>
                      <TableCell>{getStatusBadge(doc.status)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button variant="ghost" size="icon" asChild>
                            <Link href={`/dashboard/documents/${doc.id}`}>
                              <Eye className="h-4 w-4" />
                            </Link>
                          </Button>
                          {doc.file_url && (
                            <Button variant="ghost" size="icon" asChild>
                              <a href={doc.file_url} download={doc.file_name}>
                                <Download className="h-4 w-4" />
                              </a>
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </Suspense>
  )
}
