"use client"

import type React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Upload, Save } from "lucide-react"
import Link from "next/link"
import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { DOCUMENT_CATEGORIES } from "@/lib/utils/dashboard-routing"
import { getDepartmentLabel } from "@/lib/utils/permissions"
import { supabase } from "@/lib/supabase/client"

export default function UploadDocumentPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const returnTo = searchParams.get("returnTo") || "/dashboard/documents"

  const [formData, setFormData] = useState({
    title: "",
    reporting_period: "",
    category: "",
    notes: "",
    file: null as File | null,
  })
  const [department, setDepartment] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadProfile() {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("department")
          .eq("id", user.id)
          .single()
        if (profile) setDepartment(profile.department)
      }
    }
    loadProfile()
  }, [])

  const handleChange = (field: string, value: string | File | null) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleChange("file", e.target.files?.[0] || null)
  }

  const handleSubmit = async (e: React.FormEvent, action: "draft" | "submit") => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    if (!formData.title || !formData.reporting_period || !formData.category) {
      setError("Report Title, Reporting Period, and Document Category are required")
      setIsLoading(false)
      return
    }

    if (!formData.file || formData.file.size === 0) {
      setError("Please select a file to upload")
      setIsLoading(false)
      return
    }

    const allowedTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-powerpoint",
      "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    ]
    if (!allowedTypes.includes(formData.file.type)) {
      setError("Invalid file type. Allowed: PDF, Word, Excel, PowerPoint")
      setIsLoading(false)
      return
    }

    try {
      const fd = new FormData()
      fd.append("file", formData.file)
      fd.append("title", formData.title)
      fd.append("reporting_period", formData.reporting_period)
      fd.append("category", formData.category)
      fd.append("notes", formData.notes)
      fd.append("submit_action", action)

      const res = await fetch("/api/documents/upload", {
        method: "POST",
        body: fd,
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || "Upload failed")
      }

      router.push(returnTo)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to upload document")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={returnTo}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Upload New Report</h1>
          <p className="text-muted-foreground">
            Submit a departmental report for review and approval
          </p>
        </div>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Report Details</CardTitle>
          <CardDescription>
            Provide the required information. After submission, the document becomes read-only.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">
                Report Title <span className="text-destructive">*</span>
              </Label>
              <Input
                id="title"
                placeholder="Enter report title"
                value={formData.title}
                onChange={(e) => handleChange("title", e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="reporting_period">
                Reporting Period <span className="text-destructive">*</span>
              </Label>
              <Input
                id="reporting_period"
                placeholder="e.g. Q1 2025, January 2025, FY 2024-2025"
                value={formData.reporting_period}
                onChange={(e) => handleChange("reporting_period", e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="department">Department</Label>
              <Input
                id="department"
                value={department ? getDepartmentLabel(department as any) : "Loading..."}
                disabled
                className="bg-muted"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">
                Document Category <span className="text-destructive">*</span>
              </Label>
              <Select value={formData.category} onValueChange={(v) => handleChange("category", v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {DOCUMENT_CATEGORIES.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="file">
                Upload File <span className="text-destructive">*</span>
              </Label>
              <div className="flex items-center gap-4">
                <Input
                  id="file"
                  type="file"
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx"
                  onChange={handleFileChange}
                  required
                  className="flex-1"
                />
                {formData.file && (
                  <span className="text-sm text-muted-foreground">
                    {(formData.file.size / 1024).toFixed(1)} KB
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                PDF, Word, Excel, PowerPoint (Max 10MB)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Optional Notes</Label>
              <Textarea
                id="notes"
                placeholder="Add any notes (visible only before submission)"
                value={formData.notes}
                onChange={(e) => handleChange("notes", e.target.value)}
                rows={3}
              />
            </div>

            {error && (
              <div className="rounded-md bg-destructive/10 border border-destructive/20 p-3">
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}

            <div className="flex gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={(e) => handleSubmit(e, "draft")}
                disabled={isLoading}
              >
                <Save className="mr-2 h-4 w-4" />
                Save as Draft
              </Button>
              <Button
                type="button"
                onClick={(e) => handleSubmit(e, "submit")}
                disabled={isLoading}
              >
                <Upload className="mr-2 h-4 w-4" />
                {isLoading ? "Submitting..." : "Submit for Review"}
              </Button>
              <Button type="button" variant="ghost" asChild>
                <Link href={returnTo}>Cancel</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
