"use client"

import { useState } from "react"
import { ListChecks, RefreshCw } from "lucide-react"
import { useSupabaseQuery } from "@/lib/hooks/use-supabase-query"
import { useLookups } from "@/lib/hooks/use-lookups"
import { PriorityBadge, StatusBadge } from "@/components/shared/badges"
import { ListSkeleton, EmptyState, ErrorState, NotConfiguredState } from "@/components/shared/states"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { TaskDetailDialog } from "@/components/shared/task-detail-dialog"
import { FilterBar } from "@/components/admin/filter-bar"
import type { TaskRequest } from "@/lib/types"

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

export default function AdminTasks() {
  const { assetMap, userMap } = useLookups()
  const [active, setActive] = useState<TaskRequest | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [priorityFilter, setPriorityFilter] = useState<string>("all")

  const { data, isLoading, error, notConfigured, mutate } = useSupabaseQuery<TaskRequest[]>(
    "admin:tasks",
    (sb) =>
      sb
        .from("task_request")
        .select("*")
        .order("requested_at", { ascending: false })
        .limit(100),
    { refreshInterval: 30000 },
  )

  const tasks = data ?? []

  const filteredTasks = tasks.filter((task) => {
    const matchesSearch =
      !searchQuery ||
      task.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (task.asset_id && assetMap.get(task.asset_id)?.name?.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (task.asset_id && assetMap.get(task.asset_id)?.asset_code?.toLowerCase().includes(searchQuery.toLowerCase()))

    const matchesStatus = statusFilter === "all" || task.status === statusFilter
    const matchesPriority = priorityFilter === "all" || task.priority === parseInt(priorityFilter)

    return matchesSearch && matchesStatus && matchesPriority
  })

  const handleRefresh = () => {
    mutate()
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">All Tasks</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            View and search all maintenance requests across the system
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
        searchPlaceholder="Search by description, asset name or code..."
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        filters={[
          {
            label: "Status",
            value: statusFilter,
            onChange: setStatusFilter,
            options: [
              { value: "all", label: "All Statuses" },
              { value: "pending_approval", label: "Pending Approval" },
              { value: "approved", label: "Approved" },
              { value: "rejected", label: "Rejected" },
            ],
          },
          {
            label: "Priority",
            value: priorityFilter,
            onChange: setPriorityFilter,
            options: [
              { value: "all", label: "All Priorities" },
              { value: "0", label: "Critical (0)" },
              { value: "1", label: "Urgent (1)" },
              { value: "2", label: "Non-urgent (2)" },
            ],
          },
        ]}
      />

      {/* Task List */}
      <section className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <ListChecks className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            {filteredTasks.length} task{filteredTasks.length !== 1 ? "s" : ""}
          </h2>
        </div>

        {notConfigured ? (
          <NotConfiguredState />
        ) : isLoading ? (
          <ListSkeleton />
        ) : error ? (
          <ErrorState message={error.message} onRetry={() => mutate()} />
        ) : filteredTasks.length === 0 ? (
          <EmptyState
            title="No tasks found"
            description={tasks.length === 0 ? "No tasks have been created yet." : "Try adjusting your filters."}
          />
        ) : (
          <div className="flex flex-col gap-2">
            {filteredTasks.map((task) => {
              const asset = task.asset_id ? assetMap.get(task.asset_id) : undefined
              const reporter = task.created_by_user_id ? userMap.get(task.created_by_user_id) : undefined

              return (
                <button
                  key={task.task_request_id}
                  onClick={() => setActive(task)}
                  className="flex items-center gap-3 border border-border bg-card p-3 text-left transition-colors hover:border-primary"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-sm font-semibold">{asset?.name ?? "Unknown asset"}</span>
                      {asset?.asset_code && (
                        <span className="shrink-0 font-mono text-xs text-muted-foreground">{asset.asset_code}</span>
                      )}
                    </div>
                    <p className="mt-0.5 truncate text-sm text-muted-foreground">{task.description || "No description"}</p>
                    <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                      <span>Reporter: {reporter?.full_name ?? "Unknown"}</span>
                      <span>{timeAgo(task.requested_at)}</span>
                    </div>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1.5">
                    <PriorityBadge priority={task.priority} />
                    <StatusBadge status={task.status} />
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </section>

      <TaskDetailDialog
        task={active}
        open={!!active}
        onOpenChange={(v) => !v && setActive(null)}
        assetLabel={active?.asset_id ? assetMap.get(active.asset_id)?.name : undefined}
        assetLocation={active?.asset_id ? assetMap.get(active.asset_id)?.location ?? undefined : undefined}
        reporterName={active?.created_by_user_id ? userMap.get(active.created_by_user_id)?.full_name : undefined}
      />
    </div>
  )
}
