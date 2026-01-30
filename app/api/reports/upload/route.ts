import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    
    // Get authenticated user
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get user profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("department")
      .eq("id", user.id)
      .single()

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 })
    }

    const formData = await request.formData()
    const file = formData.get("file") as File
    const title = formData.get("title") as string
    const reportType = formData.get("report_type") as string
    const description = formData.get("description") as string
    const tags = formData.get("tags") as string
    const isConfidential = formData.get("is_confidential") === "true"

    if (!file || !title || !reportType) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Upload file to Supabase Storage
    const fileExt = file.name.split(".").pop()
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
    const filePath = `${profile.department}/${fileName}`

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("reports")
      .upload(filePath, file)

    if (uploadError) {
      console.error("Upload error:", uploadError)
      return NextResponse.json({ error: "Failed to upload file" }, { status: 500 })
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from("reports")
      .getPublicUrl(filePath)

    // Parse tags
    const tagsArray = tags ? tags.split(",").map((tag) => tag.trim()).filter(Boolean) : []

    // Insert report record
    const { data: report, error: insertError } = await supabase
      .from("general_reports")
      .insert({
        user_id: user.id,
        department: profile.department,
        title,
        report_type: reportType,
        description: description || null,
        file_url: publicUrl,
        file_name: file.name,
        file_size: file.size,
        file_type: file.type,
        tags: tagsArray,
        is_confidential: isConfidential,
        status: "submitted",
      })
      .select()
      .single()

    if (insertError) {
      console.error("Insert error:", insertError)
      return NextResponse.json({ error: "Failed to save report" }, { status: 500 })
    }

    return NextResponse.json({ success: true, report })
  } catch (error) {
    console.error("Error uploading report:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
