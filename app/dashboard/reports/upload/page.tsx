"use client"

import React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Upload, FileText } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"
import { Checkbox } from "@/components/ui/checkbox"

export default function UploadReportPage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [file, setFile] = useState<File | null>(null)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const formData = new FormData(e.currentTarget)
      
      const response = await fetch("/api/reports/upload", {
        method: "POST",
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to upload report")
      }
      
      toast.success("Report uploaded successfully")
      router.push("/dashboard/reports")
      router.refresh()
    } catch (error: any) {
      toast.error(error.message || "Failed to upload report")
      console.error(error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Link href="/dashboard/reports">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <h1 className="text-3xl font-bold tracking-tight">Upload Report</h1>
          </div>
          <p className="text-muted-foreground">Upload a new departmental report</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Report Information</CardTitle>
          <CardDescription>Fill in the details and upload your report file</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">Report Title *</Label>
              <Input
                id="title"
                name="title"
                placeholder="e.g., Monthly Financial Summary - January 2024"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="report_type">Report Type *</Label>
              <Select name="report_type" required>
                <SelectTrigger>
                  <SelectValue placeholder="Select report type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="weekly">Weekly Report</SelectItem>
                  <SelectItem value="monthly">Monthly Report</SelectItem>
                  <SelectItem value="quarterly">Quarterly Report</SelectItem>
                  <SelectItem value="annual">Annual Report</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                placeholder="Brief description of the report contents..."
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tags">Tags (comma separated)</Label>
              <Input
                id="tags"
                name="tags"
                placeholder="e.g., finance, budget, Q1"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="file">Report File *</Label>
              <div className="flex items-center gap-4">
                <Input
                  id="file"
                  name="file"
                  type="file"
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx"
                  required
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                />
                {file && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <FileText className="h-4 w-4" />
                    <span>{file.name}</span>
                  </div>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Supported formats: PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX (Max 10MB)
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox id="is_confidential" name="is_confidential" />
              <Label
                htmlFor="is_confidential"
                className="text-sm font-normal cursor-pointer"
              >
                Mark as confidential (restricted to department members only)
              </Label>
            </div>

            <div className="flex gap-4">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>Uploading...</>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Report
                  </>
                )}
              </Button>
              <Button type="button" variant="outline" asChild>
                <Link href="/dashboard/reports">Cancel</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
