import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single()

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 })
    }

    const allowedRoles = ["MANAGING_DIRECTOR", "BOOTSTRAP_ADMIN", "ADMIN", "EXECUTIVE", "HEAD_OF_DEPARTMENT"]
    if (!allowedRoles.includes(profile.role)) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
    }

    const { data: doc, error: fetchError } = await supabase
      .from("documents")
      .select("id, status")
      .eq("id", id)
      .single()

    if (fetchError || !doc) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 })
    }

    if (doc.status !== "submitted") {
      return NextResponse.json(
        { error: "Only submitted documents can be marked as reviewed" },
        { status: 400 }
      )
    }

    const { error: updateError } = await supabase
      .from("documents")
      .update({
        status: "reviewed_no_comments",
        reviewed_by: user.id,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)

    if (updateError) {
      console.error("Update error:", updateError)
      return NextResponse.json({ error: "Failed to update document" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error reviewing document:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
