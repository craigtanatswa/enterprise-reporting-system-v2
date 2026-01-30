"use server"

import { createClient } from "@/lib/supabase/server"

export async function activateUserAccount(
  userId: string,
  role: string,
  notes: string
) {
  const supabase = await createClient()

  // Ensure caller is authenticated
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: "Not authenticated" }
  }

  // Ensure caller has permission
  const { data: approver } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()

  if (!approver || !["ADMIN", "BOOTSTRAP_ADMIN", "MANAGING_DIRECTOR"].includes(approver.role)) {
    return { success: false, error: "Insufficient permissions" }
  }

  // Activate account
  const { error } = await supabase
    .from("profiles")
    .update({
      is_active: true,
      role,
      approval_notes: notes,
      approved_at: new Date().toISOString(),
      approved_by: user.id,
    })
    .eq("id", userId)

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true }
}

export async function deactivateUserAccount(userId: string, notes: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: "Not authenticated" }
  }

  const { data: approver } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()

  if (!approver || !["ADMIN", "BOOTSTRAP_ADMIN", "MANAGING_DIRECTOR"].includes(approver.role)) {
    return { success: false, error: "Insufficient permissions" }
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      is_active: false,
      approval_notes: notes,
      approved_at: new Date().toISOString(),
      approved_by: user.id,
    })
    .eq("id", userId)

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true }
}
