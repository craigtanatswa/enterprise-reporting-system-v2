import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { getRoleLabel, getDepartmentLabel } from "@/lib/utils/permissions"
import { Mail, Phone, Building, Calendar } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default async function ProfilePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

  if (!profile) {
    return <div>Profile not found</div>
  }

  const initials = profile.full_name
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Profile</h1>
        <p className="text-muted-foreground">Manage your account information</p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Profile Card */}
        <Card className="md:col-span-1">
          <CardHeader className="text-center">
            <Avatar className="mx-auto h-24 w-24">
              <AvatarFallback className="text-2xl">{initials}</AvatarFallback>
            </Avatar>
            <CardTitle className="mt-4">{profile.full_name}</CardTitle>
            <CardDescription>{getRoleLabel(profile.role)}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Badge className="w-full justify-center" variant={profile.is_active ? "default" : "secondary"}>
              {profile.is_active ? "Active" : "Inactive"}
            </Badge>
            <Button variant="outline" className="w-full bg-transparent" asChild>
              <Link href="/dashboard/profile/edit">Edit Profile</Link>
            </Button>
          </CardContent>
        </Card>

        {/* Details Card */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Account Details</CardTitle>
            <CardDescription>Your personal and professional information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-6 sm:grid-cols-2">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Mail className="h-4 w-4" />
                  <span>Email</span>
                </div>
                <p className="font-medium">{profile.email}</p>
              </div>

              {profile.phone && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Phone className="h-4 w-4" />
                    <span>Phone</span>
                  </div>
                  <p className="font-medium">{profile.phone}</p>
                </div>
              )}

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Building className="h-4 w-4" />
                  <span>Department</span>
                </div>
                <p className="font-medium">{getDepartmentLabel(profile.department)}</p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>Joined</span>
                </div>
                <p className="font-medium">{new Date(profile.created_at).toLocaleDateString()}</p>
              </div>
            </div>

            <div className="rounded-lg border bg-muted/40 p-4">
              <h4 className="mb-2 font-semibold">Role: {getRoleLabel(profile.role)}</h4>
              <p className="text-sm text-muted-foreground">
                {profile.role === "md" &&
                  "You have full access to all system features and can manage all users and departments."}
                {profile.role === "admin" && "You can manage users, approve documents, and access all departments."}
                {profile.role === "factory_manager" &&
                  "You can approve documents and export reports for your department."}
                {profile.role === "accountant" && "You can view financial data and export reports."}
                {profile.role === "data_entry" && "You can create and manage reports for your department."}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
