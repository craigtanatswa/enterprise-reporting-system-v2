"use server"

import { createClient } from "@/lib/supabase/server"
import { SINGLE_HOLDER_ROLES } from "@/lib/utils/permissions"

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

  // Only one GM and one CSM per system
  if (SINGLE_HOLDER_ROLES.includes(role as any)) {
    const { data: existing } = await supabase
      .from("profiles")
      .select("id")
      .eq("role", role)
      .eq("is_active", true)
      .neq("id", userId)
      .limit(1)
      .single()
    if (existing) {
      return {
        success: false,
        error: `There is already a ${role === "GENERAL_MANAGER" ? "General Manager" : "Corporate Services Manager"} assigned. Only one can hold this role.`,
      }
    }
  }

  // Build update - GM and CSM need correct department
  const updates: Record<string, unknown> = {
    is_active: true,
    role,
    approval_notes: notes,
    approved_at: new Date().toISOString(),
    approved_by: user.id,
  }
  if (role === "GENERAL_MANAGER") updates.department = "OPERATIONS"
  if (role === "CORPORATE_SERVICES_MANAGER") updates.department = "OFFICE_OF_CORPORATE_SERVICES"

  const { error } = await supabase.from("profiles").update(updates).eq("id", userId)

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
