import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { BalanceScorecardUploadForm } from "@/components/balance-scorecard/upload-form"

export default async function BalanceScorecardUploadPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

  if (!profile) {
    redirect("/auth/login")
  }

  // Get current quarter
  const now = new Date()
  const currentYear = now.getFullYear()
  const currentMonth = now.getMonth() + 1
  const currentQuarter = Math.ceil(currentMonth / 3)

  // Check if already submitted for this quarter
  const { data: existing } = await supabase
    .from("balance_scorecards")
    .select("*")
    .eq("user_id", user.id)
    .eq("year", currentYear)
    .eq("quarter", currentQuarter)
    .single()

  if (existing && existing.status !== "draft") {
    redirect("/dashboard/balance-scorecard")
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Upload Balance Scorecard</h1>
        <p className="text-muted-foreground">
          Submit your quarterly balance scorecard for Q{currentQuarter} {currentYear}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Scorecard Details</CardTitle>
          <CardDescription>
            Upload your balance scorecard document. This will be submitted for MD approval.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <BalanceScorecardUploadForm
            userId={user.id}
            year={currentYear}
            quarter={currentQuarter}
            existingId={existing?.id}
          />
        </CardContent>
      </Card>
    </div>
  )
}
