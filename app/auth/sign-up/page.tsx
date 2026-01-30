"use client"

import type React from "react"

import { supabase } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import Image from "next/image"
import { Info, CheckCircle2 } from "lucide-react"

export default function SignUpPage() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    fullName: "",
    phone: "",
    role: "",
    department: "",
    subDepartment: "",
  })
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isFirstUser, setIsFirstUser] = useState(false)
  const router = useRouter()

  useEffect(() => {
    async function checkFirstUser() {
      const { count } = await supabase.from("profiles").select("*", { count: "exact", head: true })
      setIsFirstUser(count === 0)
    }
    checkFirstUser()
  }, [])

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match")
      setIsLoading(false)
      return
    }

    if (!formData.department) {
      setError("Please select a department")
      setIsLoading(false)
      return
    }

    if (formData.department === "OPERATIONS" && !formData.subDepartment) {
      setError("Please select a sub-department for Operations")
      setIsLoading(false)
      return
    }

    try {
      const { error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          emailRedirectTo: process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL || `${window.location.origin}/dashboard`,
          data: {
            full_name: formData.fullName,
            role: isFirstUser ? "BOOTSTRAP_ADMIN" : formData.role || "STAFF",
            department: formData.department,
            sub_department: formData.subDepartment || null,
            phone: formData.phone,
          },
        },
      })
      if (error) throw error

      if (isFirstUser) {
        router.push("/auth/verify-email?type=bootstrap")
      } else {
        router.push("/auth/verify-email?type=pending")
      }
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10 bg-muted/40">
      <div className="w-full max-w-md">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col items-center gap-2 text-center">
            <div className="relative h-20 w-32">
              <Image src="/images/arda-logo.png" alt="ARDA Seeds" fill className="object-contain" priority />
            </div>
            <p className="text-sm text-muted-foreground">Enterprise Reporting Platform</p>
            {isFirstUser && (
              <div className="rounded-lg bg-primary/10 border border-primary/20 p-3 mt-2">
                <p className="text-sm font-medium text-primary">First user will be assigned Bootstrap Admin role</p>
              </div>
            )}
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Create Account</CardTitle>
              <CardDescription>
                {isFirstUser ? "Create the first admin account" : "Request access to the reporting platform"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!isFirstUser && (
                <Alert className="mb-4">
                  <Info className="h-4 w-4" />
                  <AlertDescription className="text-sm space-y-2">
                    <p className="font-medium">Account Activation Requirements:</p>
                    <ul className="space-y-1 ml-4">
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0" />
                        <span>Verify your email address (check inbox after registration)</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0" />
                        <span>Administrator approval (you'll be notified by email)</span>
                      </li>
                    </ul>
                    <p className="text-xs text-muted-foreground mt-2">
                      Both conditions must be met before you can sign in.
                    </p>
                  </AlertDescription>
                </Alert>
              )}

              <form onSubmit={handleSignUp}>
                <div className="flex flex-col gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="fullName">Full Name</Label>
                    <Input
                      id="fullName"
                      type="text"
                      placeholder="John Doe"
                      required
                      value={formData.fullName}
                      onChange={(e) => handleChange("fullName", e.target.value)}
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="user@ardaseed.com"
                      required
                      value={formData.email}
                      onChange={(e) => handleChange("email", e.target.value)}
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="+263 123 456 789"
                      value={formData.phone}
                      onChange={(e) => handleChange("phone", e.target.value)}
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="department">Department</Label>
                    <Select value={formData.department} onValueChange={(value) => handleChange("department", value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select department" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="OPERATIONS">Operations</SelectItem>
                        <SelectItem value="FINANCE">Finance</SelectItem>
                        <SelectItem value="MARKETING_AND_SALES">Marketing and Sales</SelectItem>
                        <SelectItem value="LEGAL_AND_COMPLIANCE">Legal & Compliance</SelectItem>
                        <SelectItem value="HUMAN_RESOURCES_AND_ADMINISTRATION">
                          Human Resources & Administration
                        </SelectItem>
                        <SelectItem value="PROPERTIES_MANAGEMENT">Properties Management</SelectItem>
                        <SelectItem value="ICT_AND_DIGITAL_TRANSFORMATION">ICT & Digital Transformation</SelectItem>
                        <SelectItem value="PROCUREMENT">Procurement</SelectItem>
                        <SelectItem value="PUBLIC_RELATIONS">Public Relations</SelectItem>
                        <SelectItem value="AUDIT">Audit</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {formData.department === "OPERATIONS" && (
                    <div className="grid gap-2">
                      <Label htmlFor="subDepartment">Sub-Department *</Label>
                      <Select
                        value={formData.subDepartment}
                        onValueChange={(value) => handleChange("subDepartment", value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select sub-department" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="AGRONOMY">Agronomy</SelectItem>
                          <SelectItem value="FACTORY">Factory</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {!isFirstUser && (
                    <div className="grid gap-2">
                      <Label htmlFor="role">Requested Role (Optional)</Label>
                      <Select value={formData.role} onValueChange={(value) => handleChange("role", value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select your role (defaults to Staff)" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="STAFF">Staff</SelectItem>
                          <SelectItem value="HEAD_OF_DEPARTMENT">Head of Department</SelectItem>
                          <SelectItem value="EXECUTIVE">Executive</SelectItem>
                          <SelectItem value="AUDITOR">Auditor</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground">
                        Admin will review and assign the appropriate role during activation
                      </p>
                    </div>
                  )}

                  <div className="grid gap-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      required
                      value={formData.password}
                      onChange={(e) => handleChange("password", e.target.value)}
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="confirmPassword">Confirm Password</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      required
                      value={formData.confirmPassword}
                      onChange={(e) => handleChange("confirmPassword", e.target.value)}
                    />
                  </div>

                  {error && (
                    <div className="rounded-md bg-destructive/10 border border-destructive/20 p-3">
                      <p className="text-sm text-destructive">{error}</p>
                    </div>
                  )}

                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? "Creating account..." : isFirstUser ? "Create Bootstrap Admin" : "Request Account"}
                  </Button>
                </div>
                <div className="mt-4 text-center text-sm text-muted-foreground">
                  Already have an account?{" "}
                  <Link href="/auth/login" className="text-primary underline-offset-4 hover:underline">
                    Sign in
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
