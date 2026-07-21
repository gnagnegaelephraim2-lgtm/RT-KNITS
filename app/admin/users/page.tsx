"use client"

import { useState } from "react"
import { Users, Plus, RefreshCw } from "lucide-react"
import { useSupabaseQuery } from "@/lib/hooks/use-supabase-query"
import { useLookups } from "@/lib/hooks/use-lookups"
import { ListSkeleton, EmptyState, ErrorState, NotConfiguredState } from "@/components/shared/states"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { UserCard } from "@/components/admin/user-card"
import { FilterBar } from "@/components/admin/filter-bar"
import { toast } from "sonner"
import type { AppUser, Role } from "@/lib/types"

const ROLES: Role[] = ["operator", "technician", "admin"]

export default function AdminUsers() {
  const { departments } = useLookups()
  const [searchQuery, setSearchQuery] = useState("")
  const [roleFilter, setRoleFilter] = useState<string>("all")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [resetPinDialogOpen, setResetPinDialogOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<AppUser | null>(null)
  const [resetPinUser, setResetPinUser] = useState<AppUser | null>(null)
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    phone_number: "",
    role: "operator" as Role,
    department_id: "",
    preferred_language: "en",
  })
  const [newPin, setNewPin] = useState("")

  const { data, isLoading, error, notConfigured, mutate } = useSupabaseQuery<AppUser[]>(
    "admin:users",
    (sb) =>
      sb
        .from("app_user")
        .select("*")
        .order("full_name", { ascending: true }),
    { refreshInterval: 30000 },
  )

  const handleRefresh = () => {
    mutate()
  }

  const handleAdd = () => {
    setEditingUser(null)
    setFormData({
      full_name: "",
      email: "",
      phone_number: "",
      role: "operator",
      department_id: "",
      preferred_language: "en",
    })
    setDialogOpen(true)
  }

  const handleEdit = (user: AppUser) => {
    setEditingUser(user)
    setFormData({
      full_name: user.full_name,
      email: user.email || "",
      phone_number: user.phone_number,
      role: user.role,
      department_id: user.department_id || "",
      preferred_language: user.preferred_language || "en",
    })
    setDialogOpen(true)
  }

  const handleSubmit = async () => {
    if (!formData.full_name.trim() || !formData.phone_number.trim()) {
      toast.error("Please enter name and phone number")
      return
    }

    try {
      const sb = (await import("@/lib/supabase/client")).getSupabaseBrowser()
      if (!sb) {
        toast.error("Database not configured")
        return
      }

      if (editingUser) {
        const { error } = await sb
          .from("app_user")
          .update({
            full_name: formData.full_name,
            email: formData.email || null,
            phone_number: formData.phone_number,
            role: formData.role,
            department_id: formData.department_id || null,
            preferred_language: formData.preferred_language,
          })
          .eq("user_id", editingUser.user_id)

        if (error) throw error
        toast.success("User updated successfully")
      } else {
        const { error } = await sb.from("app_user").insert({
          full_name: formData.full_name,
          email: formData.email || null,
          phone_number: formData.phone_number,
          role: formData.role,
          department_id: formData.department_id || null,
          preferred_language: formData.preferred_language,
          pin_hash: "1234", // Default PIN, should be changed
          whatsapp_verified: false,
        })

        if (error) throw error
        toast.success("User added successfully. Default PIN is 1234.")
      }

      setDialogOpen(false)
      mutate()
    } catch (err) {
      toast.error("Failed to save user")
    }
  }

  const handleResetPin = (user: AppUser) => {
    setResetPinUser(user)
    setNewPin("")
    setResetPinDialogOpen(true)
  }

  const handleConfirmResetPin = async () => {
    if (!newPin.match(/^\d{4,6}$/)) {
      toast.error("PIN must be 4-6 digits")
      return
    }

    if (!resetPinUser) return

    try {
      const sb = (await import("@/lib/supabase/client")).getSupabaseBrowser()
      if (!sb) {
        toast.error("Database not configured")
        return
      }

      const { error } = await sb
        .from("app_user")
        .update({ pin_hash: newPin })
        .eq("user_id", resetPinUser.user_id)

      if (error) throw error
      toast.success("PIN reset successfully")
      setResetPinDialogOpen(false)
      setResetPinUser(null)
    } catch (err) {
      toast.error("Failed to reset PIN")
    }
  }

  const users = data ?? []

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      !searchQuery ||
      user.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.phone_number.includes(searchQuery) ||
      user.email?.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesRole = roleFilter === "all" || user.role === roleFilter
    return matchesSearch && matchesRole
  })

  const roleCounts = {
    operator: users.filter((u) => u.role === "operator").length,
    technician: users.filter((u) => u.role === "technician").length,
    admin: users.filter((u) => u.role === "admin").length,
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Users</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage system users and access ({roleCounts.operator} operators, {roleCounts.technician} technicians, {roleCounts.admin} admins)
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            className="gap-2 rounded-md"
            onClick={handleRefresh}
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
          <Button size="sm" className="gap-2 rounded-md" onClick={handleAdd}>
            <Plus className="h-4 w-4" />
            Add User
          </Button>
        </div>
      </div>

      {/* Filters */}
      <FilterBar
        searchPlaceholder="Search by name, phone, or email..."
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        filters={[
          {
            label: "Role",
            value: roleFilter,
            onChange: setRoleFilter,
            options: [
              { value: "all", label: "All Roles" },
              ...ROLES.map((role) => ({
                value: role,
                label: role.charAt(0).toUpperCase() + role.slice(1),
              })),
            ],
          },
        ]}
      />

      {/* Users List */}
      <section className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            {filteredUsers.length} user{filteredUsers.length !== 1 ? "s" : ""}
          </h2>
        </div>

        {notConfigured ? (
          <NotConfiguredState />
        ) : isLoading ? (
          <ListSkeleton />
        ) : error ? (
          <ErrorState message={error.message} onRetry={() => mutate()} />
        ) : filteredUsers.length === 0 ? (
          <EmptyState
            title="No users found"
            description={users.length === 0 ? "No users have been added yet." : "Try adjusting your filters."}
            action={
              users.length === 0 && (
                <Button size="sm" className="gap-2 rounded-md" onClick={handleAdd}>
                  <Plus className="h-4 w-4" />
                  Add first user
                </Button>
              )
            }
          />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {filteredUsers.map((user) => (
              <UserCard
                key={user.user_id}
                user={user}
                departmentName={user.department_id ? departments.find((d) => d.department_id === user.department_id)?.name : undefined}
                onEdit={handleEdit}
                onResetPin={handleResetPin}
              />
            ))}
          </div>
        )}
      </section>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md rounded-lg">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold">
              {editingUser ? "Edit User" : "Add User"}
            </DialogTitle>
          </DialogHeader>

          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">Full Name</label>
              <input
                type="text"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                placeholder="Enter full name"
                className="rounded-md border border-border bg-background px-3 py-2 text-sm"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">Phone Number</label>
              <input
                type="tel"
                value={formData.phone_number}
                onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                placeholder="e.g., +2301234567"
                className="rounded-md border border-border bg-background px-3 py-2 text-sm font-mono"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">Email (optional)</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="email@example.com"
                className="rounded-md border border-border bg-background px-3 py-2 text-sm"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">Role</label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value as Role })}
                className="rounded-md border border-border bg-background px-3 py-2 text-sm"
              >
                {ROLES.map((role) => (
                  <option key={role} value={role}>
                    {role.charAt(0).toUpperCase() + role.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">Department (optional)</label>
              <select
                value={formData.department_id}
                onChange={(e) => setFormData({ ...formData, department_id: e.target.value })}
                className="rounded-md border border-border bg-background px-3 py-2 text-sm"
              >
                <option value="">None</option>
                {departments.map((dept) => (
                  <option key={dept.department_id} value={dept.department_id}>
                    {dept.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">Preferred Language</label>
              <select
                value={formData.preferred_language}
                onChange={(e) => setFormData({ ...formData, preferred_language: e.target.value })}
                className="rounded-md border border-border bg-background px-3 py-2 text-sm"
              >
                <option value="en">English</option>
                <option value="fr">French</option>
              </select>
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1 rounded-md"
                onClick={() => setDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button className="flex-1 rounded-md" onClick={handleSubmit}>
                {editingUser ? "Save Changes" : "Add User"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Reset PIN Dialog */}
      <Dialog open={resetPinDialogOpen} onOpenChange={setResetPinDialogOpen}>
        <DialogContent className="max-w-sm rounded-lg">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold">Reset PIN</DialogTitle>
          </DialogHeader>

          <div className="flex flex-col gap-4">
            <p className="text-sm text-muted-foreground">
              Reset PIN for <span className="font-medium text-foreground">{resetPinUser?.full_name}</span>
            </p>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">New PIN (4-6 digits)</label>
              <input
                type="password"
                value={newPin}
                onChange={(e) => setNewPin(e.target.value)}
                placeholder="Enter new PIN"
                maxLength={6}
                className="rounded-md border border-border bg-background px-3 py-2 text-sm font-mono text-center tracking-widest"
              />
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1 rounded-md"
                onClick={() => setResetPinDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                className="flex-1 rounded-md"
                onClick={handleConfirmResetPin}
              >
                Reset
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
