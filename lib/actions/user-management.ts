"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import type { UserRole, Department, SubDepartment } from "@/lib/utils/permissions"

interface ApproveAccountParams {
  userId: string
  approvedBy: string
  notes?: string
  assignRole?: UserRole
  assignDepartment?: Department
  assignSubDepartment?: SubDepartment | null
}

export async function approveAccount(params: ApproveAccountParams) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: "Unauthorized" }
  }

  // Verify approver has permission
  const { data: approverProfile } = await supabase.from("profiles").select("role").eq("id", user.id).single()

  if (!approverProfile || !["ADMIN", "BOOTSTRAP_ADMIN"].includes(approverProfile.role)) {
    return { success: false, error: "Insufficient permissions" }
  }

  try {
    // Build update object
    const updates: any = {
      is_active: true,
      requires_approval: false,
      approved_at: new Date().toISOString(),
      promotion_approved_by: params.approvedBy,
      approval_notes: params.notes,
    }

    // Optionally update role and department
    if (params.assignRole) {
      updates.role = params.assignRole
    }
    if (params.assignDepartment) {
      updates.department = params.assignDepartment
    }
    if (params.assignSubDepartment !== undefined) {
      updates.sub_department = params.assignSubDepartment
    }

    // Update profile
    const { error: updateError } = await supabase.from("profiles").update(updates).eq("id", params.userId)

    if (updateError) throw updateError

    // Log the approval
    await supabase.from("audit_logs").insert({
      actor_id: params.approvedBy,
      action: "USER_ACCOUNT_APPROVED",
      entity_type: "user",
      entity_id: params.userId,
      new_values: updates,
      justification: params.notes,
    })

    revalidatePath("/dashboard/admin")
    revalidatePath("/dashboard/users")

    return { success: true }
  } catch (error: any) {
    console.error("[v0] Error approving account:", error)
    return { success: false, error: error.message || "Failed to approve account" }
  }
}

export async function deactivateAccount(userId: string, reason?: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: "Unauthorized" }
  }

  // Verify admin permission
  const { data: adminProfile } = await supabase.from("profiles").select("role").eq("id", user.id).single()

  if (!adminProfile || !["ADMIN", "BOOTSTRAP_ADMIN"].includes(adminProfile.role)) {
    return { success: false, error: "Insufficient permissions" }
  }

  try {
    // Deactivate profile
    const { error: updateError } = await supabase.from("profiles").update({ is_active: false }).eq("id", userId)

    if (updateError) throw updateError

    // Log the deactivation
    await supabase.from("audit_logs").insert({
      actor_id: user.id,
      action: "USER_ACCOUNT_DEACTIVATED",
      entity_type: "user",
      entity_id: userId,
      justification: reason,
    })

    revalidatePath("/dashboard/admin")
    revalidatePath("/dashboard/users")

    return { success: true }
  } catch (error: any) {
    console.error("[v0] Error deactivating account:", error)
    return { success: false, error: error.message || "Failed to deactivate account" }
  }
}

export async function activateAccount(userId: string, reason?: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: "Unauthorized" }
  }

  const { data: adminProfile } = await supabase.from("profiles").select("role").eq("id", user.id).single()

  if (!adminProfile || !["ADMIN", "BOOTSTRAP_ADMIN"].includes(adminProfile.role)) {
    return { success: false, error: "Insufficient permissions" }
  }

  try {
    const { error: updateError } = await supabase.from("profiles").update({ is_active: true }).eq("id", userId)

    if (updateError) throw updateError

    await supabase.from("audit_logs").insert({
      actor_id: user.id,
      action: "USER_ACCOUNT_ACTIVATED",
      entity_type: "user",
      entity_id: userId,
      justification: reason,
    })

    revalidatePath("/dashboard/admin")
    revalidatePath("/dashboard/users")

    return { success: true }
  } catch (error: any) {
    console.error("[v0] Error activating account:", error)
    return { success: false, error: error.message || "Failed to activate account" }
  }
}

export async function deleteUser(userId: string, reason?: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: "Unauthorized" }
  }

  const { data: adminProfile } = await supabase.from("profiles").select("role").eq("id", user.id).single()

  if (!adminProfile || !["ADMIN", "BOOTSTRAP_ADMIN"].includes(adminProfile.role)) {
    return { success: false, error: "Insufficient permissions" }
  }

  // Prevent deleting self
  if (userId === user.id) {
    return { success: false, error: "Cannot delete your own account" }
  }

  try {
    // Log before deletion
    await supabase.from("audit_logs").insert({
      actor_id: user.id,
      action: "USER_ACCOUNT_DELETED",
      entity_type: "user",
      entity_id: userId,
      justification: reason,
    })

    // Delete profile (cascade will handle related records)
    const { error: deleteError } = await supabase.from("profiles").delete().eq("id", userId)

    if (deleteError) throw deleteError

    revalidatePath("/dashboard/admin")
    revalidatePath("/dashboard/users")

    return { success: true }
  } catch (error: any) {
    console.error("[v0] Error deleting user:", error)
    return { success: false, error: error.message || "Failed to delete user" }
  }
}

export async function changeUserRole(userId: string, newRole: UserRole, reason?: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: "Unauthorized" }
  }

  const { data: adminProfile } = await supabase.from("profiles").select("role").eq("id", user.id).single()

  if (!adminProfile || !["ADMIN", "BOOTSTRAP_ADMIN"].includes(adminProfile.role)) {
    return { success: false, error: "Insufficient permissions" }
  }

  // Only BOOTSTRAP_ADMIN can create other admins
  if ((newRole === "ADMIN" || newRole === "BOOTSTRAP_ADMIN") && adminProfile.role !== "BOOTSTRAP_ADMIN") {
    return { success: false, error: "Only Bootstrap Admin can create administrators" }
  }

  try {
    const { data: targetUser } = await supabase.from("profiles").select("role").eq("id", userId).single()

    const { error: updateError } = await supabase.from("profiles").update({ role: newRole }).eq("id", userId)

    if (updateError) throw updateError

    await supabase.from("audit_logs").insert({
      actor_id: user.id,
      action: "USER_ROLE_CHANGED",
      entity_type: "user",
      entity_id: userId,
      old_values: { role: targetUser?.role },
      new_values: { role: newRole },
      justification: reason,
    })

    revalidatePath("/dashboard/admin")
    revalidatePath("/dashboard/users")

    return { success: true }
  } catch (error: any) {
    console.error("[v0] Error changing user role:", error)
    return { success: false, error: error.message || "Failed to change user role" }
  }
}

export async function getPendingApprovals() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { data: null, error: "Unauthorized" }
  }

  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("requires_approval", true)
      .eq("is_active", false)
      .order("created_at", { ascending: false })

    if (error) throw error

    return { data, error: null }
  } catch (error: any) {
    console.error("[v0] Error fetching pending approvals:", error)
    return { data: null, error: error.message }
  }
}
