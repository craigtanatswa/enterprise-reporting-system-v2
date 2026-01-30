"use client"

import type React from "react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase/client"

export default function NewDispatchReportPage() {
  const router = useRouter()

  const [formData, setFormData] = useState({
    dispatchDate: new Date().toISOString().split("T")[0],
    vehicleNumber: "",
    driverName: "",
    destination: "",
    productName: "",
    quantity: "",
    unit: "kg",
    invoiceNumber: "",
    customerName: "",
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

      const { error: insertError } = await supabase.from("dispatch_reports").insert({
        dispatch_date: formData.dispatchDate,
        department: profile.department,
        vehicle_number: formData.vehicleNumber,
        driver_name: formData.driverName,
        destination: formData.destination,
        product_name: formData.productName,
        quantity: Number(formData.quantity),
        unit: formData.unit,
        invoice_number: formData.invoiceNumber || null,
        customer_name: formData.customerName,
        remarks: formData.remarks || null,
        created_by: user.id,
      })

      if (insertError) throw insertError

      router.push("/dashboard/dispatch")
      router.refresh()
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "Failed to create dispatch report")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/dispatch">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">New Dispatch Report</h1>
          <p className="text-muted-foreground">Record vehicle dispatch details</p>
        </div>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Dispatch Details</CardTitle>
          <CardDescription>Enter the dispatch information for this shipment</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="dispatchDate">Dispatch Date *</Label>
              <Input
                id="dispatchDate"
                type="date"
                value={formData.dispatchDate}
                onChange={(e) => handleChange("dispatchDate", e.target.value)}
                required
              />
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="vehicleNumber">Vehicle Number *</Label>
                <Input
                  id="vehicleNumber"
                  placeholder="e.g., KA-01-AB-1234"
                  value={formData.vehicleNumber}
                  onChange={(e) => handleChange("vehicleNumber", e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="driverName">Driver Name *</Label>
                <Input
                  id="driverName"
                  placeholder="Driver's full name"
                  value={formData.driverName}
                  onChange={(e) => handleChange("driverName", e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="customerName">Customer Name *</Label>
                <Input
                  id="customerName"
                  placeholder="Customer or company name"
                  value={formData.customerName}
                  onChange={(e) => handleChange("customerName", e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="destination">Destination *</Label>
                <Input
                  id="destination"
                  placeholder="Delivery location"
                  value={formData.destination}
                  onChange={(e) => handleChange("destination", e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="productName">Product Name *</Label>
              <Input
                id="productName"
                placeholder="e.g., Soybean Seeds"
                value={formData.productName}
                onChange={(e) => handleChange("productName", e.target.value)}
                required
              />
            </div>

            <div className="grid gap-6 sm:grid-cols-3">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="quantity">Quantity *</Label>
                <Input
                  id="quantity"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.quantity}
                  onChange={(e) => handleChange("quantity", e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="unit">Unit</Label>
                <Input id="unit" value={formData.unit} onChange={(e) => handleChange("unit", e.target.value)} />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="invoiceNumber">Invoice Number</Label>
              <Input
                id="invoiceNumber"
                placeholder="Optional invoice number"
                value={formData.invoiceNumber}
                onChange={(e) => handleChange("invoiceNumber", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="remarks">Remarks</Label>
              <Textarea
                id="remarks"
                placeholder="Any additional notes"
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
                {isLoading ? "Creating..." : "Create Dispatch"}
              </Button>
              <Button type="button" variant="outline" asChild>
                <Link href="/dashboard/dispatch">Cancel</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
