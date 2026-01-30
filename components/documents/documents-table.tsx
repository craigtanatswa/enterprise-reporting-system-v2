"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { FileText, MoreVertical, Download, Eye, Edit, Archive, Trash2 } from "lucide-react"
import Link from "next/link"

interface Document {
  id: string
  title: string
  description: string
  category: string
  file_name: string
  file_size: number
  version: number
  status: string
  department: string
  created_at: string
  uploaded_by: { full_name: string } | null
  approved_by: { full_name: string } | null
}

export function DocumentsTable({ documents }: { documents: Document[] }) {
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

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      production: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
      quality: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
      dispatch: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
      hr: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300",
      accounts: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
      compliance: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
      other: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300",
    }
    return colors[category] || colors.other
  }

  if (documents.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <div className="rounded-full bg-muted p-3 mb-3">
            <FileText className="h-6 w-6 text-muted-foreground" />
          </div>
          <p className="text-sm text-muted-foreground">No documents found</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Documents</CardTitle>
        <CardDescription>{documents.length} document(s) found</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Document</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Version</TableHead>
              <TableHead>Uploaded By</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {documents.map((doc) => (
              <TableRow key={doc.id}>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-medium">{doc.title}</span>
                    <span className="text-xs text-muted-foreground">
                      {doc.file_name} • {formatFileSize(doc.file_size)}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge className={getCategoryColor(doc.category)} variant="outline">
                    {doc.category}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={getStatusVariant(doc.status)}>{doc.status.replace("_", " ")}</Badge>
                </TableCell>
                <TableCell>v{doc.version}</TableCell>
                <TableCell>{doc.uploaded_by?.full_name || "Unknown"}</TableCell>
                <TableCell>{new Date(doc.created_at).toLocaleDateString()}</TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link href={`/dashboard/documents/${doc.id}`}>
                          <Eye className="mr-2 h-4 w-4" />
                          View Details
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Download className="mr-2 h-4 w-4" />
                        Download
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem>
                        <Archive className="mr-2 h-4 w-4" />
                        Archive
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive">
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
