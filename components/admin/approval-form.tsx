"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CheckCircle2, XCircle, Loader2 } from "lucide-react"
import { activateUserAccount, deactivateUserAccount } from "@/lib/actions/account-activation"
import { useToast } from "@/hooks/use-toast"

interface ApprovalFormProps {
  userId: string
  currentRole: string
}

export function ApprovalForm({ userId, currentRole }: ApprovalFormProps) {
  const [notes, setNotes] = useState("")
  const [assignedRole, setAssignedRole] = useState(currentRole)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  const handleApprove = async () => {
    setIsLoading(true)
    try {
      const result = await activateUserAccount(userId, assignedRole, notes || "Account approved by administrator")

      if (result.success) {
        toast({
          title: "Account Activated",
          description: "The user has been notified and can now access the system.",
        })
        router.push("/dashboard/admin/approvals")
        router.refresh()
      } else {
        toast({
          title: "Activation Failed",
          description: result.error || "Failed to activate account",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleReject = async () => {
    if (!notes.trim()) {
      toast({
        title: "Justification Required",
        description: "Please provide a reason for rejection",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    try {
      const result = await deactivateUserAccount(userId, notes)

      if (result.success) {
        toast({
          title: "Account Rejected",
          description: "The user has been notified.",
        })
        router.push("/dashboard/admin/approvals")
        router.refresh()
      } else {
        toast({
          title: "Rejection Failed",
          description: result.error || "Failed to reject account",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Approval Decision</CardTitle>
        <CardDescription>Assign role and approve or reject this account activation</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="role">Assign Role</Label>
          <Select value={assignedRole} onValueChange={setAssignedRole}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="STAFF">Staff</SelectItem>
              <SelectItem value="HEAD_OF_DEPARTMENT">Head of Department</SelectItem>
              <SelectItem value="GENERAL_MANAGER">General Manager</SelectItem>
              <SelectItem value="CORPORATE_SERVICES_MANAGER">Corporate Services Manager</SelectItem>
              <SelectItem value="AUDITOR">Auditor</SelectItem>
              <SelectItem value="MANAGING_DIRECTOR">Managing Director</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Review the requested role and adjust if necessary before approval
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="notes">Notes / Justification {!notes.trim() && "(Required for Rejection)"}</Label>
          <Textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add any notes or justification for this decision..."
            rows={3}
          />
        </div>

        <div className="flex gap-4">
          <Button onClick={handleApprove} disabled={isLoading} className="flex-1">
            {isLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
            Approve & Activate
          </Button>
          <Button onClick={handleReject} disabled={isLoading} variant="destructive" className="flex-1">
            {isLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <XCircle className="h-4 w-4 mr-2" />}
            Reject Account
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
