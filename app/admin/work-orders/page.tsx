"use client"

import { useState } from "react"
import { ClipboardList, RefreshCw } from "lucide-react"
import { useSupabaseQuery } from "@/lib/hooks/use-supabase-query"
import { useLookups } from "@/lib/hooks/use-lookups"
import { PriorityBadge, StatusBadge } from "@/components/shared/badges"
import { ListSkeleton, EmptyState, ErrorState, NotConfiguredState } from "@/components/shared/states"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { FilterBar } from "@/components/admin/filter-bar"
import type { WorkOrder, TaskRequest } from "@/lib/types"

interface WorkOrderWithDetails extends WorkOrder {
  task_request?: TaskRequest
  asset_name?: string
  asset_code?: string
  asset_location?: string
  reporter_name?: string
  assigned_technicians?: Array<{
    technician_id: string
    full_name: string
    status: string
  }>
  work_order_technician?: Array<{
    technician_id: string
    status: string
  }>
}

function timeAgo(dt: string | null | undefined) {
  if (!dt) return ""
  const d = new Date(dt).getTime()
  if (Number.isNaN(d)) return ""
  const diff = Date.now() - d
  const mins = Math.round(diff / 60000)
  if (mins < 1) return "just now"
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.round(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.round(hrs / 24)}d ago`
}

function formatDate(dt: string | null | undefined) {
  if (!dt) return ""
  return new Date(dt).toLocaleDateString()
}

export default function AdminWorkOrders() {
  const { assetMap, userMap, techMap } = useLookups()
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")

  const { data, isLoading, error, notConfigured, mutate } = useSupabaseQuery<WorkOrderWithDetails[]>(
    "admin:work-orders",
    (sb) =>
      sb
        .from("work_order")
        .select(`
          *,
          task_request (
            task_request_id,
            asset_id,
            description,
            priority,
            created_by_user_id,
            status
          ),
          work_order_technician (
            technician_id,
            status
          )
        `)
        .order("created_at", { ascending: false })
        .limit(100),
    { refreshInterval: 30000 },
  )

  const workOrders = data ?? []

  const enrichedWorkOrders = workOrders.map((wo) => ({
    ...wo,
    asset_name: wo.task_request?.asset_id ? assetMap.get(wo.task_request.asset_id)?.name : undefined,
    asset_code: wo.task_request?.asset_id ? assetMap.get(wo.task_request.asset_id)?.asset_code : undefined,
    asset_location: wo.task_request?.asset_id ? assetMap.get(wo.task_request.asset_id)?.location : undefined,
    reporter_name: wo.task_request?.created_by_user_id ? userMap.get(wo.task_request.created_by_user_id)?.full_name : undefined,
    assigned_technicians: wo.work_order_technician?.map((wot: any) => ({
      technician_id: wot.technician_id,
      full_name: techMap.get(wot.technician_id)?.full_name,
      status: wot.status,
    })),
  }))

  const filteredWorkOrders = enrichedWorkOrders.filter((wo) => {
    const matchesSearch =
      !searchQuery ||
      wo.asset_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      wo.asset_code?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      wo.task_request?.description?.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesStatus = statusFilter === "all" || wo.status === statusFilter

    return matchesSearch && matchesStatus
  })

  const handleRefresh = () => {
    mutate()
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Work Orders</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Track all work orders and technician assignments
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
        searchPlaceholder="Search by asset, description..."
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        filters={[
          {
            label: "Status",
            value: statusFilter,
            onChange: setStatusFilter,
            options: [
              { value: "all", label: "All Statuses" },
              { value: "pending", label: "Pending" },
              { value: "in_progress", label: "In Progress" },
              { value: "paused", label: "Paused" },
              { value: "completed", label: "Completed" },
              { value: "cancelled", label: "Cancelled" },
            ],
          },
        ]}
      />

      {/* Work Orders List */}
      <section className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <ClipboardList className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            {filteredWorkOrders.length} work order{filteredWorkOrders.length !== 1 ? "s" : ""}
          </h2>
        </div>

        {notConfigured ? (
          <NotConfiguredState />
        ) : isLoading ? (
          <ListSkeleton />
        ) : error ? (
          <ErrorState message={error.message} onRetry={() => mutate()} />
        ) : filteredWorkOrders.length === 0 ? (
          <EmptyState
            title="No work orders found"
            description={workOrders.length === 0 ? "No work orders have been created yet." : "Try adjusting your filters."}
          />
        ) : (
          <div className="flex flex-col gap-2">
            {filteredWorkOrders.map((wo) => (
              <Card key={wo.work_order_id} className="rounded-lg border-border bg-card p-4">
                <div className="flex flex-col gap-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="truncate text-sm font-semibold">{wo.asset_name ?? "Unknown asset"}</span>
                        {wo.asset_code && (
                          <span className="shrink-0 font-mono text-xs text-muted-foreground">{wo.asset_code}</span>
                        )}
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {wo.task_request?.description || "No description"}
                      </p>
                      <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                        <span>Reporter: {wo.reporter_name ?? "Unknown"}</span>
                        <span>Created: {timeAgo(wo.created_at)}</span>
                        {wo.completed_at && <span>Completed: {formatDate(wo.completed_at)}</span>}
                      </div>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1.5">
                      <PriorityBadge priority={wo.task_request?.priority ?? 0} />
                      <StatusBadge status={wo.status} />
                    </div>
                  </div>

                  {wo.assigned_technicians && wo.assigned_technicians.length > 0 && (
                    <div className="border-t border-border pt-3">
                      <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                        Assigned Technicians
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {wo.assigned_technicians.map((tech: any) => (
                          <span
                            key={tech.technician_id}
                            className="rounded-md bg-muted px-2 py-1 text-xs"
                          >
                            {tech.full_name || "Unknown"} · {tech.status}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {wo.recommended_technician_id && (
                    <div className="text-xs text-muted-foreground">
                      Recommended: {techMap.get(wo.recommended_technician_id)?.full_name || "Unknown"}
                      {wo.recommendation_reason && ` · ${wo.recommendation_reason}`}
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
