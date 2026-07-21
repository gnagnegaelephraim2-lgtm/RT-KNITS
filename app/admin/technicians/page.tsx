"use client"

import { useState } from "react"
import { HardHat, Plus, RefreshCw } from "lucide-react"
import { useSupabaseQuery } from "@/lib/hooks/use-supabase-query"
import { ListSkeleton, EmptyState, ErrorState, NotConfiguredState } from "@/components/shared/states"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { TechnicianCard } from "@/components/admin/technician-card"
import { FilterBar } from "@/components/admin/filter-bar"
import { toast } from "sonner"
import type { Technician, Trade } from "@/lib/types"

const TRADES: Trade[] = ["mechanic", "electrician", "welder", "plumber", "hvac", "general"]

export default function AdminTechnicians() {
  const [searchQuery, setSearchQuery] = useState("")
  const [tradeFilter, setTradeFilter] = useState<string>("all")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingTech, setEditingTech] = useState<Technician | null>(null)
  const [formData, setFormData] = useState({
    full_name: "",
    trade: "general" as Trade,
    active: true,
  })

  const { data, isLoading, error, notConfigured, mutate } = useSupabaseQuery<Technician[]>(
    "admin:technicians",
    (sb) =>
      sb
        .from("technician")
        .select("*")
        .order("full_name", { ascending: true }),
    { refreshInterval: 30000 },
  )

  const handleRefresh = () => {
    mutate()
  }

  const handleAdd = () => {
    setEditingTech(null)
    setFormData({ full_name: "", trade: "general", active: true })
    setDialogOpen(true)
  }

  const handleEdit = (tech: Technician) => {
    setEditingTech(tech)
    setFormData({ full_name: tech.full_name, trade: tech.trade, active: tech.active })
    setDialogOpen(true)
  }

  const handleSubmit = async () => {
    if (!formData.full_name.trim()) {
      toast.error("Please enter a name")
      return
    }

    try {
      const sb = (await import("@/lib/supabase/client")).getSupabaseBrowser()
      if (!sb) {
        toast.error("Database not configured")
        return
      }

      if (editingTech) {
        const { error } = await sb
          .from("technician")
          .update({
            full_name: formData.full_name,
            trade: formData.trade,
            active: formData.active,
          })
          .eq("technician_id", editingTech.technician_id)

        if (error) throw error
        toast.success("Technician updated successfully")
      } else {
        const { error } = await sb.from("technician").insert({
          full_name: formData.full_name,
          trade: formData.trade,
          active: formData.active,
        })

        if (error) throw error
        toast.success("Technician added successfully")
      }

      setDialogOpen(false)
      mutate()
    } catch (err) {
      toast.error("Failed to save technician")
    }
  }

  const handleToggleActive = async (tech: Technician) => {
    try {
      const sb = (await import("@/lib/supabase/client")).getSupabaseBrowser()
      if (!sb) {
        toast.error("Database not configured")
        return
      }

      const { error } = await sb
        .from("technician")
        .update({ active: !tech.active })
        .eq("technician_id", tech.technician_id)

      if (error) throw error
      toast.success(`Technician ${tech.active ? "deactivated" : "activated"}`)
      mutate()
    } catch (err) {
      toast.error("Failed to update technician")
    }
  }

  const technicians = data ?? []

  const filteredTechnicians = technicians.filter((tech) => {
    const matchesSearch =
      !searchQuery || tech.full_name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesTrade = tradeFilter === "all" || tech.trade === tradeFilter
    return matchesSearch && matchesTrade
  })

  const activeCount = technicians.filter((t) => t.active).length

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Technicians</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage technician accounts and trade assignments ({activeCount} active)
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
            Add Technician
          </Button>
        </div>
      </div>

      {/* Filters */}
      <FilterBar
        searchPlaceholder="Search by name..."
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        filters={[
          {
            label: "Trade",
            value: tradeFilter,
            onChange: setTradeFilter,
            options: [
              { value: "all", label: "All Trades" },
              ...TRADES.map((trade) => ({
                value: trade,
                label: trade.charAt(0).toUpperCase() + trade.slice(1),
              })),
            ],
          },
        ]}
      />

      {/* Technicians List */}
      <section className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <HardHat className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            {filteredTechnicians.length} technician{filteredTechnicians.length !== 1 ? "s" : ""}
          </h2>
        </div>

        {notConfigured ? (
          <NotConfiguredState />
        ) : isLoading ? (
          <ListSkeleton />
        ) : error ? (
          <ErrorState message={error.message} onRetry={() => mutate()} />
        ) : filteredTechnicians.length === 0 ? (
          <EmptyState
            title="No technicians found"
            description={technicians.length === 0 ? "No technicians have been added yet." : "Try adjusting your filters."}
            action={
              technicians.length === 0 && (
                <Button size="sm" className="gap-2 rounded-md" onClick={handleAdd}>
                  <Plus className="h-4 w-4" />
                  Add first technician
                </Button>
              )
            }
          />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {filteredTechnicians.map((tech) => (
              <TechnicianCard
                key={tech.technician_id}
                technician={tech}
                onEdit={handleEdit}
                onToggleActive={handleToggleActive}
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
              {editingTech ? "Edit Technician" : "Add Technician"}
            </DialogTitle>
          </DialogHeader>

          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">Full Name</label>
              <input
                type="text"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                placeholder="Enter technician name"
                className="rounded-md border border-border bg-background px-3 py-2 text-sm"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">Trade</label>
              <select
                value={formData.trade}
                onChange={(e) => setFormData({ ...formData, trade: e.target.value as Trade })}
                className="rounded-md border border-border bg-background px-3 py-2 text-sm"
              >
                {TRADES.map((trade) => (
                  <option key={trade} value={trade}>
                    {trade.charAt(0).toUpperCase() + trade.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="active"
                checked={formData.active}
                onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                className="rounded-md"
              />
              <label htmlFor="active" className="text-sm font-medium">
                Active (can receive assignments)
              </label>
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
                {editingTech ? "Save Changes" : "Add Technician"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
