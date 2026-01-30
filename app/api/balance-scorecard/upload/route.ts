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

    const formData = await request.formData()
    const file = formData.get("file") as File
    const year = parseInt(formData.get("year") as string)
    const quarter = parseInt(formData.get("quarter") as string)
    const notes = formData.get("notes") as string

    if (!file || !year || !quarter) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Check if user already has a scorecard for this quarter
    const { data: existing } = await supabase
      .from("balance_scorecards")
      .select("id")
      .eq("user_id", user.id)
      .eq("year", year)
      .eq("quarter", quarter)
      .single()

    if (existing) {
      return NextResponse.json(
        { error: "You have already submitted a balance scorecard for this quarter" },
        { status: 400 }
      )
    }

    // Upload file to Supabase Storage
    const fileExt = file.name.split(".").pop()
    const fileName = `${user.id}/${year}/Q${quarter}-${Date.now()}.${fileExt}`

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("balance-scorecards")
      .upload(fileName, file)

    if (uploadError) {
      console.error("Upload error:", uploadError)
      return NextResponse.json({ error: "Failed to upload file" }, { status: 500 })
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from("balance-scorecards")
      .getPublicUrl(fileName)

    // Insert scorecard record
    const { data: scorecard, error: insertError } = await supabase
      .from("balance_scorecards")
      .insert({
        user_id: user.id,
        year,
        quarter,
        file_url: publicUrl,
        file_name: file.name,
        notes: notes || null,
        status: "pending_approval",
        submitted_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (insertError) {
      console.error("Insert error:", insertError)
      return NextResponse.json({ error: "Failed to save scorecard" }, { status: 500 })
    }

    return NextResponse.json({ success: true, scorecard })
  } catch (error) {
    console.error("Error uploading scorecard:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
