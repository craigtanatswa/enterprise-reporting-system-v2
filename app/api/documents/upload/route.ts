import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

const ALLOWED_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
]

export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("department, sub_department")
      .eq("id", user.id)
      .single()

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 })
    }

    const formData = await request.formData()
    const file = formData.get("file") as File
    const title = formData.get("title") as string
    const reportingPeriod = formData.get("reporting_period") as string
    const category = formData.get("category") as string
    const notes = formData.get("notes") as string
    const submitAction = formData.get("submit_action") as string // "draft" | "submit"

    if (!title || !reportingPeriod || !category) {
      return NextResponse.json(
        { error: "Title, Reporting Period, and Document Category are required" },
        { status: 400 }
      )
    }

    if (!file || file.size === 0) {
      return NextResponse.json({ error: "File is required" }, { status: 400 })
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Allowed: PDF, Word, Excel, PowerPoint" },
        { status: 400 }
      )
    }

    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: "File size must be under 10MB" }, { status: 400 })
    }

    const fileExt = file.name.split(".").pop()
    const fileName = `documents/${profile.department}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`

    const { error: uploadError } = await supabase.storage
      .from("reports")
      .upload(fileName, file, { upsert: false })

    if (uploadError) {
      console.error("Upload error:", uploadError)
      return NextResponse.json({ error: "Failed to upload file" }, { status: 500 })
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from("reports").getPublicUrl(fileName)

    const status = submitAction === "submit" ? "submitted" : "draft"

    const { data: document, error: insertError } = await supabase
      .from("documents")
      .insert({
        title,
        description: notes || null,
        category: category as any,
        file_url: publicUrl,
        file_name: file.name,
        file_size: file.size,
        file_type: file.type,
        department: profile.department,
        sub_department: profile.sub_department,
        reporting_period: reportingPeriod,
        uploaded_by: user.id,
        status,
        tags: [],
      })
      .select()
      .single()

    if (insertError) {
      console.error("Insert error:", insertError)
      return NextResponse.json({ error: "Failed to save document" }, { status: 500 })
    }

    return NextResponse.json({ success: true, document })
  } catch (error) {
    console.error("Error uploading document:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
