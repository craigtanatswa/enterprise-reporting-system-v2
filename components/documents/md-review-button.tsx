"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"

interface MDReviewButtonProps {
  documentId: string
  onSuccess?: () => void
}

export function MDReviewButton({ documentId, onSuccess }: MDReviewButtonProps) {
  const [loading, setLoading] = useState(false)

  const handleClick = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/documents/${documentId}/review`, { method: "POST" })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed")
      onSuccess?.()
      if (typeof window !== "undefined") window.location.reload()
    } catch {
      setLoading(false)
    }
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleClick}
      disabled={loading}
      title="Mark as Reviewed - No Comments"
    >
      {loading ? "..." : "Mark as Reviewed – No Comments"}
    </Button>
  )
}
