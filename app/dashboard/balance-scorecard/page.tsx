import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ClipboardCheck, Upload, CheckCircle, Clock, XCircle } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Info } from "lucide-react"

export default async function BalanceScorecardPage() {
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

  // Get current year and quarter
  const now = new Date()
  const currentYear = now.getFullYear()
  const currentMonth = now.getMonth() + 1
  const currentQuarter = Math.ceil(currentMonth / 3)

  // Fetch user's scorecards for the current year
  const { data: scorecards } = await supabase
    .from("balance_scorecards")
    .select("*")
    .eq("user_id", user.id)
    .eq("year", currentYear)
    .order("quarter", { ascending: false })

  // Check if user can submit for current quarter
  const hasSubmittedCurrentQuarter = scorecards?.some(
    (sc) => sc.quarter === currentQuarter && sc.status !== "draft"
  )

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Balance Scorecard</h1>
          <p className="text-muted-foreground">
            Quarterly performance tracking • {currentYear} Q{currentQuarter}
          </p>
        </div>
        {!hasSubmittedCurrentQuarter && (
          <Button asChild>
            <Link href="/dashboard/balance-scorecard/upload">
              <Upload className="mr-2 h-4 w-4" />
              Upload Scorecard
            </Link>
          </Button>
        )}
      </div>

      <Alert>
        <Info className="h-4 w-4" />
        <AlertTitle>Quarterly Submissions</AlertTitle>
        <AlertDescription>
          Balance Scorecards are submitted quarterly (4 per year). Each scorecard requires MD approval and will be
          locked after approval to maintain data integrity.
        </AlertDescription>
      </Alert>

      {/* Current Year Overview */}
      <div className="grid gap-4 md:grid-cols-4">
        {[1, 2, 3, 4].map((quarter) => {
          const scorecard = scorecards?.find((sc) => sc.quarter === quarter)
          const isCurrentQuarter = quarter === currentQuarter
          const isPastQuarter = quarter < currentQuarter

          return (
            <Card key={quarter} className={isCurrentQuarter ? "border-primary" : ""}>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between text-sm font-medium">
                  Q{quarter} {currentYear}
                  {isCurrentQuarter && <Badge variant="outline">Current</Badge>}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {scorecard ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      {scorecard.status === "approved" && <CheckCircle className="h-4 w-4 text-green-600" />}
                      {scorecard.status === "pending_approval" && <Clock className="h-4 w-4 text-yellow-600" />}
                      {scorecard.status === "rejected" && <XCircle className="h-4 w-4 text-red-600" />}
                      <span className="text-sm capitalize">{scorecard.status.replace("_", " ")}</span>
                    </div>
                    <Button variant="outline" size="sm" className="w-full bg-transparent" asChild>
                      <Link href={`/dashboard/balance-scorecard/${scorecard.id}`}>View Details</Link>
                    </Button>
                  </div>
                ) : (
                  <div className="text-center">
                    {isPastQuarter ? (
                      <p className="text-xs text-muted-foreground">No submission</p>
                    ) : isCurrentQuarter ? (
                      <Button variant="outline" size="sm" className="w-full bg-transparent" asChild>
                        <Link href="/dashboard/balance-scorecard/upload">Submit</Link>
                      </Button>
                    ) : (
                      <p className="text-xs text-muted-foreground">Not due yet</p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Previous Submissions */}
      {scorecards && scorecards.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Submission History</CardTitle>
            <CardDescription>Your balance scorecard submissions for {currentYear}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {scorecards.map((scorecard) => (
                <div key={scorecard.id} className="flex items-center justify-between border-b pb-3 last:border-0">
                  <div>
                    <p className="font-medium">
                      Q{scorecard.quarter} {scorecard.year}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Submitted {new Date(scorecard.submitted_at || scorecard.created_at).toLocaleDateString()}
                      {scorecard.is_locked && " • Locked"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={
                        scorecard.status === "approved"
                          ? "default"
                          : scorecard.status === "rejected"
                            ? "destructive"
                            : "secondary"
                      }
                    >
                      {scorecard.status.replace("_", " ")}
                    </Badge>
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/dashboard/balance-scorecard/${scorecard.id}`}>View</Link>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
