"use client"

import type React from "react"

import { supabase } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import Image from "next/image"
import { Shield, User } from "lucide-react"
import { getDepartmentDashboardUrl } from "@/lib/utils/dashboard-routing"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [loginType, setLoginType] = useState<"user" | "admin">("user")
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (error) throw error

      if (data.user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("role, is_active, department, sub_department")
          .eq("id", data.user.id)
          .single()

        if (!profile) {
          await supabase.auth.signOut()
          throw new Error("Profile not found")
        }

        if (!data.user.email_confirmed_at) {
          await supabase.auth.signOut()
          throw new Error(
            "Please verify your email address before logging in. Check your inbox for the verification link.",
          )
        }

        if (!profile.is_active) {
          await supabase.auth.signOut()
          throw new Error(
            "Your account is pending administrator approval. You will receive an email once your account is activated.",
          )
        }

        const isAdmin = profile.role === "ADMIN" || profile.role === "BOOTSTRAP_ADMIN"
        if (loginType === "admin" && !isAdmin) {
          await supabase.auth.signOut()
          throw new Error("You do not have administrator privileges. Please sign in as a standard user.")
        }

        if (loginType === "user" && isAdmin) {
          await supabase.auth.signOut()
          throw new Error("Administrator accounts must sign in through the Admin portal.")
        }

        const dashboardUrl = getDepartmentDashboardUrl(profile.department, profile.sub_department)
        router.push(dashboardUrl)
        router.refresh()
      }
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10 bg-muted/40">
      <div className="w-full max-w-sm">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col items-center gap-2 text-center">
            <div className="relative h-30 w-48">
              <Image src="/arda-logo.png" alt="ARDA Seeds" fill className="object-contain" priority />
            </div>
            <p className="text-sm text-muted-foreground">Enterprise Reporting Platform</p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Sign In</CardTitle>
              <CardDescription>Choose your sign-in type and enter your credentials</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs
                value={loginType}
                onValueChange={(value) => setLoginType(value as "user" | "admin")}
                className="w-full mb-6"
              >
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="user" className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Standard User
                  </TabsTrigger>
                  <TabsTrigger value="admin" className="flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    Administrator
                  </TabsTrigger>
                </TabsList>
              </Tabs>

              <form onSubmit={handleLogin}>
                <div className="flex flex-col gap-6">
                  <div className="grid gap-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="user@ardaseed.com"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                  <div className="grid gap-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="password">Password</Label>
                      <Link
                        href="/auth/forgot-password"
                        className="text-sm text-muted-foreground hover:text-primary underline-offset-4 hover:underline"
                      >
                        Forgot password?
                      </Link>
                    </div>
                    <Input
                      id="password"
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </div>
                  {error && (
                    <div className="rounded-md bg-destructive/10 border border-destructive/20 p-3">
                      <p className="text-sm text-destructive">{error}</p>
                    </div>
                  )}
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? "Signing in..." : `Sign In as ${loginType === "admin" ? "Admin" : "User"}`}
                  </Button>
                </div>
                <div className="mt-4 text-center text-sm text-muted-foreground">
                  Need access?{" "}
                  <Link href="/auth/sign-up" className="text-primary underline-offset-4 hover:underline">
                    Request account
                  </Link>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
