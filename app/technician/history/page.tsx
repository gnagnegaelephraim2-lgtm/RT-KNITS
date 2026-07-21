"use client"

import { useState } from "react"
import { History, Calendar } from "lucide-react"
import { useAuth } from "@/components/auth/auth-provider"
import { useSupabaseQuery } from "@/lib/hooks/use-supabase-query"
import { useLookups } from "@/lib/hooks/use-lookups"
import { PriorityBadge, StatusBadge } from "@/components/shared/badges"
import { ListSkeleton, EmptyState, ErrorState, NotConfiguredState } from "@/components/shared/states"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import type { WorkOrder, WorkOrderTechnician, TaskRequest } from "@/lib/types"

interface CompletedTask {
  work_order_id: string
  task_request_id: string | null
  status: string
  priority: number
  completed_at: string | null
  asset_id: string | null
  description: string | null
  technician_status: string
  start_time: string | null
  stop_time: string | null
}

function formatDate(dt: string | null | undefined) {
  if (!dt) return ""
  return new Date(dt).toLocaleDateString()
}

function formatDuration(start: string | null, stop: string | null) {
  if (!start || !stop) return "-"
  const s = new Date(start).getTime()
  const e = new Date(stop).getTime()
  if (Number.isNaN(s) || Number.isNaN(e)) return "-"
  const mins = Math.round((e - s) / 60000)
  if (mins < 1) return "< 1m"
  if (mins < 60) return `${mins}m`
  const hrs = Math.round(mins / 60)
  return `${hrs}h ${mins % 60}m`
}

export default function TechnicianHistory() {
  const { user } = useAuth()
  const { assetMap } = useLookups()
  const [dateFilter, setDateFilter] = useState<string>("")

  // Fetch completed work orders for this technician
  const { data, isLoading, error, notConfigured, mutate } = useSupabaseQuery<CompletedTask[]>(
    user ? `technician:history:${user.user_id}` : null,
    (sb) =>
      sb
        .from("work_order")
        .select(`
          work_order_id,
          task_request_id,
          status,
          priority,
          completed_at,
          task_request!inner (
            asset_id,
            description
          ),
          work_order_technician!inner (
            technician_id,
            status,
            start_time,
            stop_time
          )
        `)
        .eq("work_order_technician.technician_id", user!.user_id)
        .in("work_order_technician.status", ["completed", "declined"])
        .order("completed_at", { ascending: false }),
    { refreshInterval: 30000 },
  )

  const tasks = data ?? []
  const filteredTasks = dateFilter
    ? tasks.filter((t) => t.completed_at && new Date(t.completed_at).toISOString().startsWith(dateFilter))
    : tasks

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Task History</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            View your completed and declined tasks with duration tracking.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="rounded-md border border-border bg-background px-3 py-1.5 text-sm"
          />
          {dateFilter && (
            <Button size="sm" variant="ghost" className="rounded-md" onClick={() => setDateFilter("")}>
              Clear
            </Button>
          )}
        </div>
      </div>

      <section className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <History className="h-4 w-4 text-muted-foreground" />
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
            title="No history yet"
            description="Completed and declined tasks will appear here."
          />
        ) : (
          <div className="flex flex-col gap-2">
            {filteredTasks.map((task) => {
              const asset = task.asset_id ? assetMap.get(task.asset_id) : undefined
              const isDeclined = task.technician_status === "declined"

              return (
                <Card key={task.work_order_id} className="rounded-lg border-border bg-card p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="truncate text-sm font-semibold">{asset?.name ?? "Unknown asset"}</span>
                        {asset?.asset_code && (
                          <span className="shrink-0 font-mono text-xs text-muted-foreground">{asset.asset_code}</span>
                        )}
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">{task.description || "No description"}</p>
                      <div className="mt-2 flex items-center gap-2">
                        <PriorityBadge priority={task.priority as 0 | 1 | 2} />
                        {isDeclined ? (
                          <span className="text-xs font-medium text-gray-500">Declined</span>
                        ) : (
                          <span className="text-xs font-medium text-green-600">Completed</span>
                        )}
                      </div>
                    </div>

                    <div className="flex shrink-0 flex-col gap-1 text-right text-xs text-muted-foreground">
                      <div>Completed: {formatDate(task.completed_at)}</div>
                      {!isDeclined && (
                        <div>Duration: {formatDuration(task.start_time, task.stop_time)}</div>
                      )}
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}
