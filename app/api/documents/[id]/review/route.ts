import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { GM_DEPARTMENT, CSM_DEPARTMENTS } from "@/lib/utils/reporting-structure"

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

    const allowedRoles = [
      "MANAGING_DIRECTOR",
      "BOOTSTRAP_ADMIN",
      "ADMIN",
      "EXECUTIVE",
      "GENERAL_MANAGER",
      "CORPORATE_SERVICES_MANAGER",
      "HEAD_OF_DEPARTMENT",
    ]
    if (!allowedRoles.includes(profile.role)) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
    }

    const { data: doc, error: fetchError } = await supabase
      .from("documents")
      .select("id, status, department")
      .eq("id", id)
      .single()

    if (fetchError || !doc) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 })
    }

    // GM can only review Operations documents; CSM only Corporate Services departments
    if (profile.role === "GENERAL_MANAGER" && doc.department !== GM_DEPARTMENT) {
      return NextResponse.json({ error: "You can only review Operations department documents" }, { status: 403 })
    }
    if (profile.role === "CORPORATE_SERVICES_MANAGER" && !CSM_DEPARTMENTS.includes(doc.department as any)) {
      return NextResponse.json(
        { error: "You can only review documents from your supervised departments" },
        { status: 403 }
      )
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
