"use client"

import type React from "react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase/client"

export default function NewProductionReportPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    reportDate: new Date().toISOString().split("T")[0],
    shift: "",
    productName: "",
    targetQuantity: "",
    actualQuantity: "",
    unit: "kg",
    qualityGrade: "",
    status: "in_progress",
    remarks: "",
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error("Not authenticated")

      const { data: profile } = await supabase.from("profiles").select("department").eq("id", user.id).single()

      if (!profile) throw new Error("Profile not found")

      const { error: insertError } = await supabase.from("production_reports").insert({
        report_date: formData.reportDate,
        department: profile.department,
        shift: formData.shift,
        product_name: formData.productName,
        target_quantity: Number(formData.targetQuantity),
        actual_quantity: Number(formData.actualQuantity),
        unit: formData.unit,
        quality_grade: formData.qualityGrade || null,
        status: formData.status,
        remarks: formData.remarks || null,
        created_by: user.id,
      })

      if (insertError) throw insertError

      router.push("/dashboard/production")
      router.refresh()
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "Failed to create report")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/production">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">New Production Report</h1>
          <p className="text-muted-foreground">Record daily production details</p>
        </div>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Production Details</CardTitle>
          <CardDescription>Enter the production information for this shift</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-6 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="reportDate">Report Date *</Label>
                <Input
                  id="reportDate"
                  type="date"
                  value={formData.reportDate}
                  onChange={(e) => handleChange("reportDate", e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="shift">Shift *</Label>
                <Select value={formData.shift} onValueChange={(value) => handleChange("shift", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select shift" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="morning">Morning</SelectItem>
                    <SelectItem value="afternoon">Afternoon</SelectItem>
                    <SelectItem value="night">Night</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="productName">Product Name *</Label>
              <Input
                id="productName"
                placeholder="e.g., Soybean Seeds Grade A"
                value={formData.productName}
                onChange={(e) => handleChange("productName", e.target.value)}
                required
              />
            </div>

            <div className="grid gap-6 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="targetQuantity">Target Quantity *</Label>
                <Input
                  id="targetQuantity"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.targetQuantity}
                  onChange={(e) => handleChange("targetQuantity", e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="actualQuantity">Actual Quantity *</Label>
                <Input
                  id="actualQuantity"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.actualQuantity}
                  onChange={(e) => handleChange("actualQuantity", e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="unit">Unit *</Label>
                <Select value={formData.unit} onValueChange={(value) => handleChange("unit", value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="kg">Kilograms (kg)</SelectItem>
                    <SelectItem value="ton">Tons</SelectItem>
                    <SelectItem value="quintal">Quintals</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="qualityGrade">Quality Grade</Label>
                <Input
                  id="qualityGrade"
                  placeholder="e.g., Grade A"
                  value={formData.qualityGrade}
                  onChange={(e) => handleChange("qualityGrade", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status *</Label>
                <Select value={formData.status} onValueChange={(value) => handleChange("status", value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="planned">Planned</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="delayed">Delayed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="remarks">Remarks</Label>
              <Textarea
                id="remarks"
                placeholder="Any additional notes or observations"
                value={formData.remarks}
                onChange={(e) => handleChange("remarks", e.target.value)}
                rows={3}
              />
            </div>

            {error && (
              <div className="rounded-md bg-destructive/10 border border-destructive/20 p-3">
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}

            <div className="flex gap-4">
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Creating..." : "Create Report"}
              </Button>
              <Button type="button" variant="outline" asChild>
                <Link href="/dashboard/production">Cancel</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
