import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    
    // Get authenticated user
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user is MD
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single()

    if (!profile || profile.role !== "MANAGING_DIRECTOR") {
      return NextResponse.json({ error: "Only MD can approve balance scorecards" }, { status: 403 })
    }

    const body = await request.json()
    const { status, approval_notes } = body

    if (!status || !["approved", "rejected"].includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 })
    }

    // Update scorecard
    const { data: scorecard, error: updateError } = await supabase
      .from("balance_scorecards")
      .update({
        status,
        approval_notes: approval_notes || null,
        approved_at: new Date().toISOString(),
        is_locked: status === "approved",
      })
      .eq("id", params.id)
      .select()
      .single()

    if (updateError) {
      console.error("Update error:", updateError)
      return NextResponse.json({ error: "Failed to update scorecard" }, { status: 500 })
    }

    return NextResponse.json({ success: true, scorecard })
  } catch (error) {
    console.error("Error approving scorecard:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
