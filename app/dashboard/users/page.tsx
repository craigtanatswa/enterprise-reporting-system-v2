import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { UserPlus } from "lucide-react"
import { UserManagementTable } from "@/components/admin/user-management-table"

export default async function UsersPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Check if user has permission to view this page
  const { data: currentProfile } = await supabase.from("profiles").select("role").eq("id", user.id).single()

  if (!currentProfile || !["MANAGING_DIRECTOR", "ADMIN", "BOOTSTRAP_ADMIN"].includes(currentProfile.role)) {
    redirect("/dashboard")
  }

  // Fetch all users
  const { data: profiles } = await supabase.from("profiles").select("*").order("created_at", { ascending: false })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
          <p className="text-muted-foreground">Manage user accounts, roles, and permissions</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/users/add">
            <UserPlus className="mr-2 h-4 w-4" />
            Add New User
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Users</CardTitle>
          <CardDescription>View and manage all user accounts with inline actions</CardDescription>
        </CardHeader>
        <CardContent>
          <UserManagementTable users={profiles || []} currentUserId={user.id} currentUserRole={currentProfile.role} />
        </CardContent>
      </Card>
    </div>
  )
}
