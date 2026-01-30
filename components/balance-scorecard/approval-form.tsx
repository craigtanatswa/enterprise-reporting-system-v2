"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, CheckCircle, XCircle } from "lucide-react"
import { supabase } from "@/lib/supabase/client"

interface BalanceScorecardApprovalFormProps {
  scorecardId: string
}

export function BalanceScorecardApprovalForm({ scorecardId }: BalanceScorecardApprovalFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notes, setNotes] = useState("")

  const handleApproval = async (approved: boolean) => {
    setIsSubmitting(true)
    setError(null)

    try {
      const updateData = {
        status: approved ? "approved" : "rejected",
        approval_notes: notes || null,
        approved_at: approved ? new Date().toISOString() : null,
        is_locked: approved, // Lock when approved
      }

      const { error: updateError } = await supabase.from("balance_scorecards").update(updateData).eq("id", scorecardId)

      if (updateError) throw updateError

      router.push("/dashboard/balance-scorecard")
      router.refresh()
    } catch (err: any) {
      console.error("[v0] Error processing approval:", err)
      setError(err.message || "Failed to process approval")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-2">
        <Label htmlFor="approval-notes">MD Comments (Optional)</Label>
        <Textarea
          id="approval-notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Add comments or feedback..."
          rows={4}
          disabled={isSubmitting}
        />
      </div>

      <div className="flex gap-2">
        <Button onClick={() => handleApproval(true)} disabled={isSubmitting} className="flex-1">
          <CheckCircle className="mr-2 h-4 w-4" />
          {isSubmitting ? "Processing..." : "Approve & Lock"}
        </Button>
        <Button onClick={() => handleApproval(false)} disabled={isSubmitting} variant="destructive" className="flex-1">
          <XCircle className="mr-2 h-4 w-4" />
          {isSubmitting ? "Processing..." : "Reject"}
        </Button>
      </div>

      <p className="text-xs text-muted-foreground">
        Note: Approved scorecards will be locked and cannot be modified. Only 4 scorecards per year can be approved.
      </p>
    </div>
  )
}
