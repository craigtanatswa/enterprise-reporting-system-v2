"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { CheckCircle2, XCircle, MessageSquare } from "lucide-react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase/client"

interface ApprovalActionsProps {
  workflowId: string
  stepId: string
  entityType: string
}

export function ApprovalActions({ workflowId, stepId, entityType }: ApprovalActionsProps) {
  const router = useRouter()
  const [comments, setComments] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleApproval = async (action: "approved" | "rejected" | "revision_requested") => {
    setIsLoading(true)
    setError(null)

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error("Not authenticated")

      // Update approval step
      const { error: stepError } = await supabase
        .from("approval_steps")
        .update({
          status: action,
          approver_id: user.id,
          comments: comments || null,
          responded_at: new Date().toISOString(),
        })
        .eq("id", stepId)

      if (stepError) throw stepError

      // Update workflow status based on action
      if (action === "approved") {
        // Check if this was the last step
        const { data: workflow } = await supabase
          .from("approval_workflows")
          .select("current_level, total_levels")
          .eq("id", workflowId)
          .single()

        if (workflow && workflow.current_level === workflow.total_levels) {
          // Final approval - mark workflow as approved
          await supabase
            .from("approval_workflows")
            .update({
              status: "approved",
              completed_at: new Date().toISOString(),
            })
            .eq("id", workflowId)
        } else {
          // Move to next level
          await supabase
            .from("approval_workflows")
            .update({
              current_level: workflow!.current_level + 1,
            })
            .eq("id", workflowId)
        }
      } else if (action === "rejected") {
        await supabase
          .from("approval_workflows")
          .update({
            status: "rejected",
            completed_at: new Date().toISOString(),
          })
          .eq("id", workflowId)
      }

      router.push("/dashboard/approvals")
      router.refresh()
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "Failed to process approval")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Take Action</CardTitle>
        <CardDescription>Review and approve or reject this request</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="comments">Comments (Optional)</Label>
          <Textarea
            id="comments"
            placeholder="Add your feedback or notes..."
            value={comments}
            onChange={(e) => setComments(e.target.value)}
            rows={4}
          />
        </div>

        {error && (
          <div className="rounded-md bg-destructive/10 border border-destructive/20 p-3">
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        <div className="space-y-2">
          <Button
            className="w-full bg-green-600 hover:bg-green-700"
            onClick={() => handleApproval("approved")}
            disabled={isLoading}
          >
            <CheckCircle2 className="mr-2 h-4 w-4" />
            Approve
          </Button>

          <Button
            variant="outline"
            className="w-full bg-transparent"
            onClick={() => handleApproval("revision_requested")}
            disabled={isLoading}
          >
            <MessageSquare className="mr-2 h-4 w-4" />
            Request Revision
          </Button>

          <Button
            variant="destructive"
            className="w-full"
            onClick={() => handleApproval("rejected")}
            disabled={isLoading}
          >
            <XCircle className="mr-2 h-4 w-4" />
            Reject
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
