"use client"

import type React from "react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Upload } from "lucide-react"
import Link from "next/link"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase/client"

export default function UploadDocumentPage() {
  const router = useRouter()

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    file: null as File | null,
    tags: "",
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleChange = (field: string, value: string | File | null) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null
    handleChange("file", file)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    if (!formData.file || !formData.title || !formData.category) {
      setError("Please fill in all required fields")
      setIsLoading(false)
      return
    }

    try {
      // Get current user
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error("Not authenticated")

      // Get user profile for department
      const { data: profile } = await supabase.from("profiles").select("department").eq("id", user.id).single()

      if (!profile) throw new Error("Profile not found")

      // For demo purposes, we'll just save metadata without actual file upload
      // In production, you would upload to Supabase Storage or another service

      const { error: insertError } = await supabase.from("documents").insert({
        title: formData.title,
        description: formData.description,
        category: formData.category,
        file_url: `/uploads/${formData.file.name}`, // Placeholder URL
        file_name: formData.file.name,
        file_size: formData.file.size,
        file_type: formData.file.type,
        department: profile.department,
        uploaded_by: user.id,
        tags: formData.tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
        status: "draft",
      })

      if (insertError) throw insertError

      router.push("/dashboard/documents")
      router.refresh()
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "Failed to upload document")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/documents">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Upload Document</h1>
          <p className="text-muted-foreground">Add a new document to the repository</p>
        </div>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Document Information</CardTitle>
          <CardDescription>Provide details about the document you're uploading</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">
                Title <span className="text-destructive">*</span>
              </Label>
              <Input
                id="title"
                placeholder="Enter document title"
                value={formData.title}
                onChange={(e) => handleChange("title", e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Brief description of the document"
                value={formData.description}
                onChange={(e) => handleChange("description", e.target.value)}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">
                Category <span className="text-destructive">*</span>
              </Label>
              <Select value={formData.category} onValueChange={(value) => handleChange("category", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="production">Production</SelectItem>
                  <SelectItem value="quality">Quality</SelectItem>
                  <SelectItem value="dispatch">Dispatch</SelectItem>
                  <SelectItem value="hr">HR</SelectItem>
                  <SelectItem value="accounts">Accounts</SelectItem>
                  <SelectItem value="compliance">Compliance</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="tags">Tags</Label>
              <Input
                id="tags"
                placeholder="Comma-separated tags (e.g., invoice, 2025, urgent)"
                value={formData.tags}
                onChange={(e) => handleChange("tags", e.target.value)}
              />
              <p className="text-xs text-muted-foreground">Add tags to help organize and search documents</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="file">
                File <span className="text-destructive">*</span>
              </Label>
              <div className="flex items-center gap-4">
                <Input id="file" type="file" onChange={handleFileChange} required className="flex-1" />
                {formData.file && (
                  <span className="text-sm text-muted-foreground">{(formData.file.size / 1024).toFixed(1)} KB</span>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Supported formats: PDF, DOC, DOCX, XLS, XLSX, JPG, PNG (Max 10MB)
              </p>
            </div>

            {error && (
              <div className="rounded-md bg-destructive/10 border border-destructive/20 p-3">
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}

            <div className="flex gap-4">
              <Button type="submit" disabled={isLoading}>
                <Upload className="mr-2 h-4 w-4" />
                {isLoading ? "Uploading..." : "Upload Document"}
              </Button>
              <Button type="button" variant="outline" asChild>
                <Link href="/dashboard/documents">Cancel</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
