"use client"

import React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, Upload } from "lucide-react"
import { supabase } from "@/lib/supabase/client"

interface BalanceScorecardUploadFormProps {
  userId: string
  year: number
  quarter: number
  existingId?: string
}

export function BalanceScorecardUploadForm({ userId, year, quarter, existingId }: BalanceScorecardUploadFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [notes, setNotes] = useState("")

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      // Validate file type
      const validTypes = ["application/pdf", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"]
      if (!validTypes.includes(selectedFile.type)) {
        setError("Please upload a PDF or Excel file")
        return
      }
      // Validate file size (max 10MB)
      if (selectedFile.size > 10 * 1024 * 1024) {
        setError("File size must be less than 10MB")
        return
      }
      setFile(selectedFile)
      setError(null)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    try {
      if (!file) {
        setError("Please select a file to upload")
        return
      }

      // Use API route for upload
      const formData = new FormData()
      formData.append("file", file)
      formData.append("year", year.toString())
      formData.append("quarter", quarter.toString())
      formData.append("notes", notes)

      const response = await fetch("/api/balance-scorecard/upload", {
        method: "POST",
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to upload balance scorecard")
      }

      router.push("/dashboard/balance-scorecard")
      router.refresh()
    } catch (err: any) {
      console.error("[v0] Error uploading balance scorecard:", err)
      setError(err.message || "Failed to upload balance scorecard")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-2">
        <Label htmlFor="file">Scorecard File *</Label>
        <Input
          id="file"
          type="file"
          accept=".pdf,.xlsx,.xls"
          onChange={handleFileChange}
          required
          disabled={isSubmitting}
        />
        <p className="text-xs text-muted-foreground">Supported formats: PDF, Excel (max 10MB)</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Additional Notes (Optional)</Label>
        <Textarea
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Add any notes or comments about this scorecard..."
          rows={4}
          disabled={isSubmitting}
        />
      </div>

      <div className="flex gap-2">
        <Button type="submit" disabled={isSubmitting || !file}>
          <Upload className="mr-2 h-4 w-4" />
          {isSubmitting ? "Uploading..." : "Submit for Approval"}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()} disabled={isSubmitting}>
          Cancel
        </Button>
      </div>
    </form>
  )
}
