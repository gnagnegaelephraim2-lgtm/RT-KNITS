"use client"

import { useState } from "react"
import { Boxes, Plus, RefreshCw } from "lucide-react"
import { useSupabaseQuery } from "@/lib/hooks/use-supabase-query"
import { ListSkeleton, EmptyState, ErrorState, NotConfiguredState } from "@/components/shared/states"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { AssetCard } from "@/components/admin/asset-card"
import { FilterBar } from "@/components/admin/filter-bar"
import { toast } from "sonner"
import type { Asset, AssetStatus, Trade } from "@/lib/types"

const ASSET_STATUSES: AssetStatus[] = ["in_use", "down", "maintenance", "retired"]
const TRADES: Trade[] = ["mechanic", "electrician", "welder", "plumber", "hvac", "general"]

export default function AdminAssets() {
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null)
  const [formData, setFormData] = useState({
    asset_code: "",
    name: "",
    status: "in_use" as AssetStatus,
    location: "",
    required_trade: null as Trade | null,
    preventive_interval_days: 30,
  })

  const { data, isLoading, error, notConfigured, mutate } = useSupabaseQuery<Asset[]>(
    "admin:assets",
    (sb) =>
      sb
        .from("asset")
        .select("*")
        .order("asset_code", { ascending: true }),
    { refreshInterval: 30000 },
  )

  const handleRefresh = () => {
    mutate()
  }

  const handleAdd = () => {
    setEditingAsset(null)
    setFormData({
      asset_code: "",
      name: "",
      status: "in_use",
      location: "",
      required_trade: null,
      preventive_interval_days: 30,
    })
    setDialogOpen(true)
  }

  const handleEdit = (asset: Asset) => {
    setEditingAsset(asset)
    setFormData({
      asset_code: asset.asset_code,
      name: asset.name,
      status: asset.status,
      location: asset.location || "",
      required_trade: asset.required_trade,
      preventive_interval_days: asset.preventive_interval_days || 30,
    })
    setDialogOpen(true)
  }

  const handleSubmit = async () => {
    if (!formData.asset_code.trim() || !formData.name.trim()) {
      toast.error("Please enter asset code and name")
      return
    }

    try {
      const sb = (await import("@/lib/supabase/client")).getSupabaseBrowser()
      if (!sb) {
        toast.error("Database not configured")
        return
      }

      if (editingAsset) {
        const { error } = await sb
          .from("asset")
          .update({
            asset_code: formData.asset_code,
            name: formData.name,
            status: formData.status,
            location: formData.location || null,
            required_trade: formData.required_trade,
            preventive_interval_days: formData.preventive_interval_days,
          })
          .eq("asset_id", editingAsset.asset_id)

        if (error) throw error
        toast.success("Asset updated successfully")
      } else {
        const { error } = await sb.from("asset").insert({
          asset_code: formData.asset_code,
          name: formData.name,
          status: formData.status,
          location: formData.location || null,
          required_trade: formData.required_trade,
          preventive_interval_days: formData.preventive_interval_days,
        })

        if (error) throw error
        toast.success("Asset added successfully")
      }

      setDialogOpen(false)
      mutate()
    } catch (err) {
      toast.error("Failed to save asset")
    }
  }

  const assets = data ?? []

  const filteredAssets = assets.filter((asset) => {
    const matchesSearch =
      !searchQuery ||
      asset.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      asset.asset_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      asset.location?.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === "all" || asset.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const getStatusColor = (status: AssetStatus) => {
    switch (status) {
      case "in_use":
        return "text-green-600"
      case "down":
        return "text-red-600"
      case "maintenance":
        return "text-orange-600"
      case "retired":
        return "text-gray-500"
      default:
        return "text-muted-foreground"
    }
  }

  const isOverdue = (asset: Asset) => {
    if (!asset.last_preventive_check || !asset.preventive_interval_days) return false
    const lastCheck = new Date(asset.last_preventive_check).getTime()
    const daysSince = (Date.now() - lastCheck) / (1000 * 60 * 60 * 24)
    return daysSince > asset.preventive_interval_days
  }

  const overdueCount = assets.filter(isOverdue).length

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Assets</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage factory assets and preventive maintenance schedules
            {overdueCount > 0 && ` (${overdueCount} overdue for preventive check)`}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            className="gap-2 rounded-lg"
            onClick={handleRefresh}
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
          <Button size="sm" className="gap-2 rounded-lg" onClick={handleAdd}>
            <Plus className="h-4 w-4" />
            Add Asset
          </Button>
        </div>
      </div>

      {/* Filters */}
      <FilterBar
        searchPlaceholder="Search by name, code, or location..."
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        filters={[
          {
            label: "Status",
            value: statusFilter,
            onChange: setStatusFilter,
            options: [
              { value: "all", label: "All Statuses" },
              ...ASSET_STATUSES.map((status) => ({
                value: status,
                label: status.replace("_", " ").replace(/\b\w/g, (c) => c.toUpperCase()),
              })),
            ],
          },
        ]}
      />

      {/* Assets List */}
      <section className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <Boxes className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            {filteredAssets.length} asset{filteredAssets.length !== 1 ? "s" : ""}
          </h2>
        </div>

        {notConfigured ? (
          <NotConfiguredState />
        ) : isLoading ? (
          <ListSkeleton />
        ) : error ? (
          <ErrorState message={error.message} onRetry={() => mutate()} />
        ) : filteredAssets.length === 0 ? (
          <EmptyState
            title="No assets found"
            description={assets.length === 0 ? "No assets have been added yet." : "Try adjusting your filters."}
            action={
              assets.length === 0 && (
                <Button size="sm" className="gap-2 rounded-lg" onClick={handleAdd}>
                  <Plus className="h-4 w-4" />
                  Add first asset
                </Button>
              )
            }
          />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {filteredAssets.map((asset) => (
              <AssetCard
                key={asset.asset_id}
                asset={asset}
                overdue={isOverdue(asset)}
                onEdit={handleEdit}
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
              {editingAsset ? "Edit Asset" : "Add Asset"}
            </DialogTitle>
          </DialogHeader>

          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">Asset Code</label>
              <input
                type="text"
                value={formData.asset_code}
                onChange={(e) => setFormData({ ...formData, asset_code: e.target.value })}
                placeholder="e.g., MCH-001"
                className="rounded-lg border border-border bg-background px-3 py-2 text-sm font-mono"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">Asset Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Knitting Machine #1"
                className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as AssetStatus })}
                className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
              >
                {ASSET_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {status.replace("_", " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">Location</label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="e.g., Production Line A"
                className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">Required Trade</label>
              <select
                value={formData.required_trade || ""}
                onChange={(e) => setFormData({ ...formData, required_trade: e.target.value as Trade | null })}
                className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
              >
                <option value="">None specified</option>
                {TRADES.map((trade) => (
                  <option key={trade} value={trade}>
                    {trade.charAt(0).toUpperCase() + trade.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">Preventive Maintenance Interval (days)</label>
              <input
                type="number"
                value={formData.preventive_interval_days}
                onChange={(e) => setFormData({ ...formData, preventive_interval_days: parseInt(e.target.value) || 30 })}
                min="1"
                className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
              />
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1 rounded-lg"
                onClick={() => setDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button className="flex-1 rounded-lg" onClick={handleSubmit}>
                {editingAsset ? "Save Changes" : "Add Asset"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
