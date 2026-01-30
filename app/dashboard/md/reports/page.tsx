"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Download, Eye, Search, FileText, Filter, RefreshCw } from "lucide-react"
import { format } from "date-fns"
import Link from "next/link"
import { getDepartmentLabel } from "@/lib/utils/permissions"
import { DOCUMENT_STATUSES } from "@/lib/utils/dashboard-routing"
import { useSearchParams } from "next/navigation"
import Loading from "./loading"

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

export default function MDSubmittedReportsPage() {
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
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
    const matchesStatus = statusFilter === "all" || doc.status === statusFilter
    const matchesDepartment = departmentFilter === "all" || doc.department === departmentFilter
    const matchesCategory = categoryFilter === "all" || doc.category === categoryFilter
    return matchesSearch && matchesStatus && matchesDepartment && matchesCategory
  })

  const submittedDocs = filteredDocuments.filter((d) => d.status === "submitted")
  const reviewedDocs = filteredDocuments.filter((d) => ["approved", "reviewed_no_comments"].includes(d.status))
  const returnedDocs = filteredDocuments.filter((d) => d.status === "returned_with_comments")

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

  const DocumentTable = ({ docs }: { docs: Document[] }) => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Title</TableHead>
          <TableHead>Department</TableHead>
          <TableHead>Category</TableHead>
          <TableHead>Period</TableHead>
          <TableHead>Submitted By</TableHead>
          <TableHead>Date</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {docs.length === 0 ? (
          <TableRow>
            <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
              No documents found
            </TableCell>
          </TableRow>
        ) : (
          docs.map((doc) => (
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
                    <Link href={`/dashboard/md/reports/${doc.id}`}>
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
  )

  if (loading) {
    return <Loading />
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Submitted Reports</h1>
          <p className="text-muted-foreground">View and review all department reports</p>
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
                  placeholder="Search reports..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
              <SelectTrigger className="w-[180px]">
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
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {DOCUMENT_STATUSES.map((status) => (
                  <SelectItem key={status.value} value={status.value}>
                    {status.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Reports</CardDescription>
            <CardTitle className="text-3xl">{filteredDocuments.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Pending Review</CardDescription>
            <CardTitle className="text-3xl text-yellow-600">{submittedDocs.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Reviewed</CardDescription>
            <CardTitle className="text-3xl text-green-600">{reviewedDocs.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Returned</CardDescription>
            <CardTitle className="text-3xl text-red-600">{returnedDocs.length}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="pending" className="space-y-4">
        <TabsList>
          <TabsTrigger value="pending">
            Pending Review ({submittedDocs.length})
          </TabsTrigger>
          <TabsTrigger value="reviewed">
            Reviewed ({reviewedDocs.length})
          </TabsTrigger>
          <TabsTrigger value="returned">
            Returned ({returnedDocs.length})
          </TabsTrigger>
          <TabsTrigger value="all">
            All ({filteredDocuments.length})
          </TabsTrigger>
        </TabsList>
        <TabsContent value="pending">
          <Card>
            <CardHeader>
              <CardTitle>Pending Review</CardTitle>
              <CardDescription>Reports awaiting your review</CardDescription>
            </CardHeader>
            <CardContent>
              <DocumentTable docs={submittedDocs} />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="reviewed">
          <Card>
            <CardHeader>
              <CardTitle>Reviewed Reports</CardTitle>
              <CardDescription>Reports that have been reviewed</CardDescription>
            </CardHeader>
            <CardContent>
              <DocumentTable docs={reviewedDocs} />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="returned">
          <Card>
            <CardHeader>
              <CardTitle>Returned Reports</CardTitle>
              <CardDescription>Reports returned with comments</CardDescription>
            </CardHeader>
            <CardContent>
              <DocumentTable docs={returnedDocs} />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="all">
          <Card>
            <CardHeader>
              <CardTitle>All Reports</CardTitle>
              <CardDescription>Complete list of all department reports</CardDescription>
            </CardHeader>
            <CardContent>
              <DocumentTable docs={filteredDocuments} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
