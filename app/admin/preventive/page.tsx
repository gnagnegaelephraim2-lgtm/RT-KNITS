"use client"

import { useState } from "react"
import { CalendarClock, Search, RefreshCw, AlertTriangle } from "lucide-react"
import { useSupabaseQuery } from "@/lib/hooks/use-supabase-query"
import { useLookups } from "@/lib/hooks/use-lookups"
import { ListSkeleton, EmptyState, ErrorState, NotConfiguredState } from "@/components/shared/states"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { AssetCard } from "@/components/admin/asset-card"
import { FilterBar } from "@/components/admin/filter-bar"
import type { Asset } from "@/lib/types"

function isOverdue(asset: Asset) {
  if (!asset.last_preventive_check || !asset.preventive_interval_days) return false
  const lastCheck = new Date(asset.last_preventive_check).getTime()
  const daysSince = (Date.now() - lastCheck) / (1000 * 60 * 60 * 24)
  return daysSince > asset.preventive_interval_days
}

function getDaysUntilDue(asset: Asset): number | null {
  if (!asset.last_preventive_check || !asset.preventive_interval_days) return null
  const lastCheck = new Date(asset.last_preventive_check).getTime()
  const daysSince = (Date.now() - lastCheck) / (1000 * 60 * 60 * 24)
  const daysUntil = asset.preventive_interval_days - daysSince
  return Math.round(daysUntil)
}

export default function AdminPreventive() {
  const { assets } = useLookups()
  const [searchQuery, setSearchQuery] = useState("")
  const [showOverdueOnly, setShowOverdueOnly] = useState(false)

  const { data, isLoading, error, notConfigured, mutate } = useSupabaseQuery<Asset[]>(
    "admin:preventive",
    (sb) =>
      sb
        .from("asset")
        .select("*")
        .order("last_preventive_check", { ascending: true }),
    { refreshInterval: 30000 },
  )

  const handleRefresh = () => {
    mutate()
  }

  const assetList = data ?? []

  const filteredAssets = assetList.filter((asset) => {
    const matchesSearch =
      !searchQuery ||
      asset.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      asset.asset_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      asset.location?.toLowerCase().includes(searchQuery.toLowerCase())

    const overdue = isOverdue(asset)
    const matchesFilter = !showOverdueOnly || overdue

    return matchesSearch && matchesFilter
  })

  // Sort: overdue first, then by days until due
  const sortedAssets = [...filteredAssets].sort((a, b) => {
    const aOverdue = isOverdue(a)
    const bOverdue = isOverdue(b)

    if (aOverdue && !bOverdue) return -1
    if (!aOverdue && bOverdue) return 1

    const aDays = getDaysUntilDue(a) ?? Infinity
    const bDays = getDaysUntilDue(b) ?? Infinity

    return aDays - bDays
  })

  const overdueCount = assetList.filter(isOverdue).length
  const dueSoonCount = assetList.filter((a) => {
    const days = getDaysUntilDue(a)
    return days !== null && days >= 0 && days <= 7
  }).length

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Preventive Maintenance</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Track assets due for preventive maintenance ({overdueCount} overdue · {dueSoonCount} due within 7 days)
          </p>
        </div>
        <Button
          size="sm"
          variant="outline"
          className="gap-2 rounded-md"
          onClick={handleRefresh}
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
      </div>

      {/* Filters */}
      <FilterBar
        searchPlaceholder="Search by name, code, or location..."
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        actions={
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={showOverdueOnly}
              onChange={(e) => setShowOverdueOnly(e.target.checked)}
              className="rounded-md"
            />
            Show only overdue
          </label>
        }
      />

      {/* Assets List */}
      <section className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <CalendarClock className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            {sortedAssets.length} asset{sortedAssets.length !== 1 ? "s" : ""}
          </h2>
        </div>

        {notConfigured ? (
          <NotConfiguredState />
        ) : isLoading ? (
          <ListSkeleton />
        ) : error ? (
          <ErrorState message={error.message} onRetry={() => mutate()} />
        ) : sortedAssets.length === 0 ? (
          <EmptyState
            title="No assets found"
            description={assetList.length === 0 ? "No assets have been added yet." : "Try adjusting your filters."}
          />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {sortedAssets.map((asset) => {
              const overdue = isOverdue(asset)
              const daysUntil = getDaysUntilDue(asset)

              return (
                <AssetCard
                  key={asset.asset_id}
                  asset={asset}
                  overdue={overdue}
                  onEdit={() => {
                    // Navigate to asset edit
                    window.location.href = `/admin/assets`
                  }}
                />
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}
