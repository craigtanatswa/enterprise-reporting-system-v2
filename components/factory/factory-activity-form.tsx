"use client"

import React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { supabase } from "@/lib/supabase/client"
import { SEED_VARIETIES, PACKAGING_SIZES, ACTIVITY_TYPES } from "@/lib/utils/dashboard-routing"
import { CheckCircle, Loader2 } from "lucide-react"

export function FactoryActivityForm() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const [formData, setFormData] = useState({
    activity_date: new Date().toISOString().split("T")[0],
    seed_category: "",
    seed_variety: "",
    activity_type: "",
    quantity_tonnes: "",
    packaging_size: "",
    notes: "",
  })

  const availableVarieties = formData.seed_category 
    ? SEED_VARIETIES[formData.seed_category as keyof typeof SEED_VARIETIES] || []
    : []

  const requiresPackaging = ["seed_processed", "seed_packaged"].includes(formData.activity_type)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    setSuccess(false)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("Not authenticated")

      const { error: insertError } = await supabase.from("factory_activities").insert({
        activity_date: formData.activity_date,
        seed_category: formData.seed_category,
        seed_variety: formData.seed_variety,
        activity_type: formData.activity_type,
        quantity_tonnes: parseFloat(formData.quantity_tonnes),
        packaging_size: requiresPackaging ? formData.packaging_size : null,
        notes: formData.notes || null,
        logged_by: user.id,
      })

      if (insertError) throw insertError

      setSuccess(true)
      setFormData({
        activity_date: new Date().toISOString().split("T")[0],
        seed_category: "",
        seed_variety: "",
        activity_type: "",
        quantity_tonnes: "",
        packaging_size: "",
        notes: "",
      })
      
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to log activity")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="activity_date">Date *</Label>
          <Input
            id="activity_date"
            type="date"
            value={formData.activity_date}
            onChange={(e) => setFormData({ ...formData, activity_date: e.target.value })}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="activity_type">Activity Type *</Label>
          <Select
            value={formData.activity_type}
            onValueChange={(value) => setFormData({ ...formData, activity_type: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select activity type" />
            </SelectTrigger>
            <SelectContent>
              {ACTIVITY_TYPES.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="seed_category">Seed Category *</Label>
          <Select
            value={formData.seed_category}
            onValueChange={(value) => setFormData({ ...formData, seed_category: value, seed_variety: "" })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              {Object.keys(SEED_VARIETIES).map((category) => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="seed_variety">Seed Variety *</Label>
          <Select
            value={formData.seed_variety}
            onValueChange={(value) => setFormData({ ...formData, seed_variety: value })}
            disabled={!formData.seed_category}
          >
            <SelectTrigger>
              <SelectValue placeholder={formData.seed_category ? "Select variety" : "Select category first"} />
            </SelectTrigger>
            <SelectContent>
              {availableVarieties.map((variety) => (
                <SelectItem key={variety} value={variety}>
                  {variety}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="quantity_tonnes">Quantity (Metric Tonnes) *</Label>
          <Input
            id="quantity_tonnes"
            type="number"
            step="0.01"
            min="0"
            placeholder="e.g., 5.50"
            value={formData.quantity_tonnes}
            onChange={(e) => setFormData({ ...formData, quantity_tonnes: e.target.value })}
            required
          />
        </div>

        {requiresPackaging && (
          <div className="space-y-2">
            <Label htmlFor="packaging_size">Packaging Size *</Label>
            <Select
              value={formData.packaging_size}
              onValueChange={(value) => setFormData({ ...formData, packaging_size: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select packaging size" />
              </SelectTrigger>
              <SelectContent>
                {PACKAGING_SIZES.map((size) => (
                  <SelectItem key={size} value={size}>
                    {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notes (Optional)</Label>
        <Textarea
          id="notes"
          placeholder="Any additional notes about this activity..."
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          rows={3}
        />
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            Activity logged successfully! The dashboard totals have been updated.
          </AlertDescription>
        </Alert>
      )}

      <Button type="submit" disabled={isLoading}>
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Logging...
          </>
        ) : (
          "Log Activity"
        )}
      </Button>
    </form>
  )
}
