"use client"

import { useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Trash2, CheckCircle, XCircle, Filter } from "lucide-react"
import { getRoleLabel, getDepartmentLabel, type UserRole, type Department } from "@/lib/utils/permissions"
import {
  activateAccount,
  deactivateAccount,
  deleteUser,
  changeUserRole,
  approveAccount,
} from "@/lib/actions/user-management"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface UserManagementTableProps {
  users: any[]
  currentUserId: string
  currentUserRole: string
}

export function UserManagementTable({ users, currentUserId, currentUserRole }: UserManagementTableProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [searchTerm, setSearchTerm] = useState("")
  const [roleFilter, setRoleFilter] = useState<string[]>([])
  const [statusFilter, setStatusFilter] = useState<string[]>([])
  const [departmentFilter, setDepartmentFilter] = useState<string[]>([])
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [userToDelete, setUserToDelete] = useState<string | null>(null)
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({})

  const setLoading = (userId: string, loading: boolean) => {
    setLoadingStates((prev) => ({ ...prev, [userId]: loading }))
  }

  const handleActivate = async (userId: string) => {
    setLoading(userId, true)
    const result = await activateAccount(userId, "Activated by admin")
    setLoading(userId, false)

    if (result.success) {
      toast({
        title: "Account Activated",
        description: "User account has been activated successfully.",
      })
      router.refresh()
    } else {
      toast({
        title: "Error",
        description: result.error || "Failed to activate account",
        variant: "destructive",
      })
    }
  }

  const handleDeactivate = async (userId: string) => {
    setLoading(userId, true)
    const result = await deactivateAccount(userId, "Deactivated by admin")
    setLoading(userId, false)

    if (result.success) {
      toast({
        title: "Account Deactivated",
        description: "User account has been deactivated successfully.",
      })
      router.refresh()
    } else {
      toast({
        title: "Error",
        description: result.error || "Failed to deactivate account",
        variant: "destructive",
      })
    }
  }

  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    setLoading(userId, true)
    const result = await changeUserRole(userId, newRole, "Role changed by admin")
    setLoading(userId, false)

    if (result.success) {
      toast({
        title: "Role Updated",
        description: `User role has been changed to ${getRoleLabel(newRole)}.`,
      })
      router.refresh()
    } else {
      toast({
        title: "Error",
        description: result.error || "Failed to change user role",
        variant: "destructive",
      })
    }
  }

  const handleApprove = async (userId: string) => {
    setLoading(userId, true)
    const result = await approveAccount({
      userId,
      approvedBy: currentUserId,
      notes: "Approved by admin from user management",
    })
    setLoading(userId, false)

    if (result.success) {
      toast({
        title: "Account Approved",
        description: "User account has been approved and activated.",
      })
      router.refresh()
    } else {
      toast({
        title: "Error",
        description: result.error || "Failed to approve account",
        variant: "destructive",
      })
    }
  }

  const confirmDelete = (userId: string) => {
    setUserToDelete(userId)
    setDeleteDialogOpen(true)
  }

  const handleDelete = async () => {
    if (!userToDelete) return

    setLoading(userToDelete, true)
    const result = await deleteUser(userToDelete, "Deleted by admin")
    setLoading(userToDelete, false)
    setDeleteDialogOpen(false)
    setUserToDelete(null)

    if (result.success) {
      toast({
        title: "User Deleted",
        description:
          result.warning ??
          "User account has been permanently removed from authentication and the directory.",
      })
      router.refresh()
    } else {
      toast({
        title: "Error",
        description: result.error || "Failed to delete user",
        variant: "destructive",
      })
    }
  }

  // Filter users
  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesRole = roleFilter.length === 0 || roleFilter.includes(user.role)

    const matchesDepartment = departmentFilter.length === 0 || departmentFilter.includes(user.department)

    const matchesStatus =
      statusFilter.length === 0 ||
      (statusFilter.includes("active") && user.is_active && !user.requires_approval) ||
      (statusFilter.includes("inactive") && !user.is_active && !user.requires_approval) ||
      (statusFilter.includes("pending") && user.requires_approval)

    return matchesSearch && matchesRole && matchesDepartment && matchesStatus
  })

  const roles: UserRole[] = [
    "BOOTSTRAP_ADMIN",
    "ADMIN",
    "MANAGING_DIRECTOR",
    "AUDITOR",
    "GENERAL_MANAGER",
    "CORPORATE_SERVICES_MANAGER",
    "HEAD_OF_DEPARTMENT",
    "STAFF",
  ]

  const departments: Department[] = [
    "AUDIT",
    "OPERATIONS",
    "FINANCE",
    "MARKETING_AND_SALES",
    "LEGAL_AND_COMPLIANCE",
    "HUMAN_RESOURCES_AND_ADMINISTRATION",
    "PROPERTIES_MANAGEMENT",
    "ICT_AND_DIGITAL_TRANSFORMATION",
    "PROCUREMENT",
    "PUBLIC_RELATIONS",
    "OFFICE_OF_CORPORATE_SERVICES",
  ]

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <Input
          placeholder="Search by name or email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="md:max-w-sm"
        />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <Filter className="mr-2 h-4 w-4" />
              Role {roleFilter.length > 0 && `(${roleFilter.length})`}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
            <DropdownMenuLabel>Filter by Role</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {roles.map((role) => (
              <DropdownMenuCheckboxItem
                key={role}
                checked={roleFilter.includes(role)}
                onCheckedChange={(checked) => {
                  if (checked) {
                    setRoleFilter([...roleFilter, role])
                  } else {
                    setRoleFilter(roleFilter.filter((r) => r !== role))
                  }
                }}
              >
                {getRoleLabel(role)}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <Filter className="mr-2 h-4 w-4" />
              Status {statusFilter.length > 0 && `(${statusFilter.length})`}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
            <DropdownMenuLabel>Filter by Status</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuCheckboxItem
              checked={statusFilter.includes("active")}
              onCheckedChange={(checked) => {
                if (checked) {
                  setStatusFilter([...statusFilter, "active"])
                } else {
                  setStatusFilter(statusFilter.filter((s) => s !== "active"))
                }
              }}
            >
              Active
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={statusFilter.includes("inactive")}
              onCheckedChange={(checked) => {
                if (checked) {
                  setStatusFilter([...statusFilter, "inactive"])
                } else {
                  setStatusFilter(statusFilter.filter((s) => s !== "inactive"))
                }
              }}
            >
              Inactive
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={statusFilter.includes("pending")}
              onCheckedChange={(checked) => {
                if (checked) {
                  setStatusFilter([...statusFilter, "pending"])
                } else {
                  setStatusFilter(statusFilter.filter((s) => s !== "pending"))
                }
              }}
            >
              Pending Approval
            </DropdownMenuCheckboxItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <Filter className="mr-2 h-4 w-4" />
              Department {departmentFilter.length > 0 && `(${departmentFilter.length})`}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
            <DropdownMenuLabel>Filter by Department</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {departments.map((dept) => (
              <DropdownMenuCheckboxItem
                key={dept}
                checked={departmentFilter.includes(dept)}
                onCheckedChange={(checked) => {
                  if (checked) {
                    setDepartmentFilter([...departmentFilter, dept])
                  } else {
                    setDepartmentFilter(departmentFilter.filter((d) => d !== dept))
                  }
                }}
              >
                {getDepartmentLabel(dept)}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {(roleFilter.length > 0 || statusFilter.length > 0 || departmentFilter.length > 0) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setRoleFilter([])
              setStatusFilter([])
              setDepartmentFilter([])
            }}
          >
            Clear Filters
          </Button>
        )}
      </div>

      <div className="text-sm text-muted-foreground">
        Showing {filteredUsers.length} of {users.length} users
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Approval</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                  No users found
                </TableCell>
              </TableRow>
            ) : (
              filteredUsers.map((user) => {
                const initials = user.full_name
                  .split(" ")
                  .map((n: string) => n[0])
                  .join("")
                  .toUpperCase()
                  .slice(0, 2)

                const isCurrentUser = user.id === currentUserId
                const isLoading = loadingStates[user.id]

                return (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9">
                          <AvatarFallback>{initials}</AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                          <span className="font-medium">{user.full_name}</span>
                          <span className="text-sm text-muted-foreground">{user.email}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Select
                        value={user.role}
                        onValueChange={(value) => handleRoleChange(user.id, value as UserRole)}
                        disabled={isCurrentUser || isLoading}
                      >
                        <SelectTrigger className="w-[180px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {roles.map((role) => (
                            <SelectItem key={role} value={role}>
                              {getRoleLabel(role)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">{getDepartmentLabel(user.department)}</span>
                    </TableCell>
                    <TableCell>
                      {user.requires_approval && !user.is_active ? (
                        <Badge variant="destructive">Pending Approval</Badge>
                      ) : (
                        <div className="flex items-center gap-2">
                          <Badge variant={user.is_active ? "default" : "secondary"}>
                            {user.is_active ? "Active" : "Inactive"}
                          </Badge>
                          {!isCurrentUser && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => (user.is_active ? handleDeactivate(user.id) : handleActivate(user.id))}
                              disabled={isLoading}
                            >
                              {user.is_active ? (
                                <XCircle className="h-4 w-4 text-destructive" />
                              ) : (
                                <CheckCircle className="h-4 w-4 text-green-600" />
                              )}
                            </Button>
                          )}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      {user.requires_approval && !user.is_active ? (
                        <Button variant="outline" size="sm" onClick={() => handleApprove(user.id)} disabled={isLoading}>
                          Approve
                        </Button>
                      ) : (
                        <span className="text-sm text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>{new Date(user.created_at).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right">
                      {!isCurrentUser && (
                        <Button variant="ghost" size="sm" onClick={() => confirmDelete(user.id)} disabled={isLoading}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the user account and all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Delete User
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
