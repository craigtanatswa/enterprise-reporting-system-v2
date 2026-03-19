"use client"

import type React from "react"

import { supabase } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { Info, ArrowLeft, UserPlus, CheckCircle2, Crown } from "lucide-react"
import { canAssignSingleHolderRole } from "@/lib/actions/user-management"

const ROLE_OPTIONS = [
  { value: "STAFF", label: "Staff" },
  { value: "HEAD_OF_DEPARTMENT", label: "Head of Department" },
  { value: "GENERAL_MANAGER", label: "General Manager" },
  { value: "CORPORATE_SERVICES_MANAGER", label: "Corporate Services Manager" },
  { value: "AUDITOR", label: "Auditor" },
  { value: "ADMIN", label: "Admin" },
  { value: "MANAGING_DIRECTOR", label: "Managing Director" },
]

// Roles that lock the department selection
const MD_ROLE = "MANAGING_DIRECTOR"
const MD_DEPARTMENT = "OFFICE_OF_THE_MANAGING_DIRECTOR"
const MD_DEPARTMENT_LABEL = "The Office of the Managing Director"
const GM_ROLE = "GENERAL_MANAGER"
const GM_DEPARTMENT = "OPERATIONS"
const CSM_ROLE = "CORPORATE_SERVICES_MANAGER"
const CSM_DEPARTMENT = "OFFICE_OF_CORPORATE_SERVICES"

export default function AdminAddUserPage() {
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
  const [success, setSuccess] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const isMDRole = formData.role === MD_ROLE
  const isGMRole = formData.role === GM_ROLE
  const isCSMRole = formData.role === CSM_ROLE
  const isDepartmentLocked = isMDRole || isGMRole || isCSMRole

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleRoleChange = (value: string) => {
    if (value === MD_ROLE) {
      setFormData((prev) => ({
        ...prev,
        role: value,
        department: MD_DEPARTMENT,
        subDepartment: "",
      }))
    } else if (value === GM_ROLE) {
      setFormData((prev) => ({
        ...prev,
        role: value,
        department: GM_DEPARTMENT,
        subDepartment: "",
      }))
    } else if (value === CSM_ROLE) {
      setFormData((prev) => ({
        ...prev,
        role: value,
        department: CSM_DEPARTMENT,
        subDepartment: "",
      }))
    } else {
      const lockedDepts = [MD_DEPARTMENT, GM_DEPARTMENT, CSM_DEPARTMENT]
      setFormData((prev) => ({
        ...prev,
        role: value,
        department: lockedDepts.includes(prev.department) ? "" : prev.department,
        subDepartment: "",
      }))
    }
  }

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    setSuccess(null)

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match")
      setIsLoading(false)
      return
    }

    if (!formData.role) {
      setError("Please select a role for this user")
      setIsLoading(false)
      return
    }

    if (!formData.department) {
      setError("Please select a department")
      setIsLoading(false)
      return
    }

    if (
      formData.department === "OPERATIONS" &&
      !formData.subDepartment &&
      formData.role !== GM_ROLE
    ) {
      setError("Please select a sub-department for Operations (except for General Manager)")
      setIsLoading(false)
      return
    }

    if (formData.role === GM_ROLE || formData.role === CSM_ROLE) {
      const { ok, error: roleError } = await canAssignSingleHolderRole(formData.role)
      if (!ok) {
        setError(roleError)
        setIsLoading(false)
        return
      }
    }

    try {
      const { data, error: signUpError } = await supabase.auth.admin.createUser({
        email: formData.email,
        password: formData.password,
        email_confirm: false,
        user_metadata: {
          full_name: formData.fullName,
          role: formData.role,
          department: formData.department,
          sub_department: formData.subDepartment || null,
          phone: formData.phone,
        },
      })

      if (signUpError) throw signUpError

      if (data.user) {
        const { error: profileError } = await supabase.from("profiles").upsert({
          id: data.user.id,
          full_name: formData.fullName,
          email: formData.email,
          phone: formData.phone || null,
          role: formData.role,
          department: formData.department,
          sub_department: formData.subDepartment || null,
          is_approved: true,
          created_at: new Date().toISOString(),
        })

        if (profileError) throw profileError
      }

      setSuccess(
        `Account created for ${formData.fullName}${isMDRole ? " (Managing Director)" : ""}. A verification email has been sent to ${formData.email}. The account is pre-approved and will be active once the user confirms their email.`,
      )

      setFormData({
        email: "",
        password: "",
        confirmPassword: "",
        fullName: "",
        phone: "",
        role: "",
        department: "",
        subDepartment: "",
      })
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An error occurred while creating the user")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-6 p-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/users">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Add New User</h1>
          <p className="text-sm text-muted-foreground">
            Create a user account directly and assign their role.
          </p>
        </div>
      </div>

      <Separator />

      {/* Info banner */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription className="text-sm space-y-2">
          <p className="font-medium">How admin-created accounts work:</p>
          <ul className="space-y-1 ml-4">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 mt-0.5 text-green-500 flex-shrink-0" />
              <span>
                The account is <strong>pre-approved</strong> — no admin review step is required.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0" />
              <span>
                A <strong>verification email</strong> is sent to confirm the address is real and reachable.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0" />
              <span>
                The user can sign in immediately after clicking the verification link.
              </span>
            </li>
          </ul>
        </AlertDescription>
      </Alert>

      {/* MD role callout */}
      {isMDRole && (
        <Alert className="border-amber-500/30 bg-amber-500/10">
          <Crown className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-sm">
            <p className="font-medium text-amber-800 dark:text-amber-400">Managing Director account</p>
            <p className="text-amber-700 dark:text-amber-500 mt-1">
              This role has exclusive access to confidential audit reports and the MD dashboard. The department has been
              automatically set to <strong>{MD_DEPARTMENT_LABEL}</strong> and cannot be changed.
            </p>
          </AlertDescription>
        </Alert>
      )}

      {/* GM role callout */}
      {isGMRole && (
        <Alert className="border-blue-500/30 bg-blue-500/10">
          <AlertDescription className="text-sm">
            <p className="font-medium text-blue-800 dark:text-blue-400">General Manager account</p>
            <p className="text-blue-700 dark:text-blue-500 mt-1">
              Oversees Operations (including Manufacturing and Agronomy). Only one General Manager per system. Department
              is set to <strong>Operations</strong>.
            </p>
          </AlertDescription>
        </Alert>
      )}

      {/* CSM role callout */}
      {isCSMRole && (
        <Alert className="border-blue-500/30 bg-blue-500/10">
          <AlertDescription className="text-sm">
            <p className="font-medium text-blue-800 dark:text-blue-400">Corporate Services Manager account</p>
            <p className="text-blue-700 dark:text-blue-500 mt-1">
              Oversees Marketing, Legal, HR, Properties, and ICT. Only one Corporate Services Manager per system.
              Department is set to <strong>Office of Corporate Services</strong>.
            </p>
          </AlertDescription>
        </Alert>
      )}

      {/* Form */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-primary" />
            <CardTitle className="text-xl">User Details</CardTitle>
          </div>
          <CardDescription>
            Fill in the details below. The assigned role and department are set immediately.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreateUser}>
            <div className="flex flex-col gap-5">
              {/* Personal info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="fullName">Full Name *</Label>
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
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+263 123 456 789"
                    value={formData.phone}
                    onChange={(e) => handleChange("phone", e.target.value)}
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="email">Email Address *</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="user@ardaseed.com"
                  required
                  value={formData.email}
                  onChange={(e) => handleChange("email", e.target.value)}
                />
              </div>

              <Separator />

              {/* Role & Department */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="role">
                    Role *{" "}
                    <Badge variant="secondary" className="ml-1 text-xs font-normal">
                      Assigned immediately
                    </Badge>
                  </Label>
                  <Select value={formData.role} onValueChange={handleRoleChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      {ROLE_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          <div className="flex items-center gap-2">
                            {opt.value === MD_ROLE && <Crown className="h-3.5 w-3.5 text-amber-500" />}
                            {opt.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="department">
                    Department *
                    {isDepartmentLocked && (
                      <Badge variant="outline" className="ml-1 text-xs font-normal border-amber-500/40 text-amber-700 dark:text-amber-400">
                        Auto-assigned
                      </Badge>
                    )}
                  </Label>
                  {isMDRole ? (
                    <div className="flex h-9 w-full items-center rounded-md border border-input bg-muted px-3 py-1 text-sm text-muted-foreground cursor-not-allowed">
                      {MD_DEPARTMENT_LABEL}
                    </div>
                  ) : isGMRole ? (
                    <div className="flex h-9 w-full items-center rounded-md border border-input bg-muted px-3 py-1 text-sm text-muted-foreground cursor-not-allowed">
                      Operations
                    </div>
                  ) : isCSMRole ? (
                    <div className="flex h-9 w-full items-center rounded-md border border-input bg-muted px-3 py-1 text-sm text-muted-foreground cursor-not-allowed">
                      Office of Corporate Services
                    </div>
                  ) : (
                    <Select
                      value={formData.department}
                      onValueChange={(value) => {
                        handleChange("department", value)
                        handleChange("subDepartment", "")
                      }}
                    >
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
                  )}
                </div>
              </div>

              {/* Operations sub-department (hidden for MD, GM) */}
              {!isMDRole && !isGMRole && formData.department === "OPERATIONS" && (
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

              <Separator />

              {/* Password */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="password">Temporary Password *</Label>
                  <Input
                    id="password"
                    type="password"
                    required
                    placeholder="Min. 8 characters"
                    value={formData.password}
                    onChange={(e) => handleChange("password", e.target.value)}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="confirmPassword">Confirm Password *</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    required
                    value={formData.confirmPassword}
                    onChange={(e) => handleChange("confirmPassword", e.target.value)}
                  />
                </div>
              </div>

              <p className="text-xs text-muted-foreground -mt-2">
                Share this temporary password with the user securely. They can change it after signing in.
              </p>

              {/* Feedback */}
              {error && (
                <div className="rounded-md bg-destructive/10 border border-destructive/20 p-3">
                  <p className="text-sm text-destructive">{error}</p>
                </div>
              )}

              {success && (
                <div className="rounded-md bg-green-500/10 border border-green-500/20 p-3 flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 mt-0.5 text-green-600 flex-shrink-0" />
                  <p className="text-sm text-green-700 dark:text-green-400">{success}</p>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-1">
                <Button type="submit" className="flex-1" disabled={isLoading}>
                  {isLoading
                    ? "Creating account..."
                    : isMDRole
                    ? "Create Managing Director Account"
                    : "Create User"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push("/dashboard/users")}
                  disabled={isLoading}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}