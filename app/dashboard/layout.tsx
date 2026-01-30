import { DashboardShell } from "@/components/dashboard/dashboard-shell"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import type React from "react"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_active")
    .eq("id", user.id)
    .single()

  if (!profile) {
    await supabase.auth.signOut()
    redirect("/auth/login")
  }

  // 🚫 HARD GATE — approval is mandatory
  if (!profile.is_active) {
    redirect("/auth/verify-email?error=pending-approval")
  }

  return <DashboardShell>{children}</DashboardShell>
}
