"use client"

import { useState, useEffect } from "react"
import { PlayCircle, CheckCircle, XCircle, Clock } from "lucide-react"
import { useAuth } from "@/components/auth/auth-provider"
import { useLookups } from "@/lib/hooks/use-lookups"
import { NitaApi } from "@/lib/api"
import { PriorityBadge } from "@/components/shared/badges"
import { ListSkeleton, EmptyState, ErrorState } from "@/components/shared/states"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { toast } from "sonner"

interface TechnicianTask {
  work_order_id: string
  status: string
  priority: number | null
  asset_name: string | null
  asset_code: string | null
  asset_location: string | null
  description: string | null
}

interface DailyTasksResponse {
  error: boolean
  count: number
  tasks: TechnicianTask[]
  message?: string
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

export default function TechnicianHome() {
  const { user } = useAuth()
  const { technicians } = useLookups()
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const technicianId = user ? technicians.find((t) => t.user_id === user.user_id)?.technician_id : undefined

  // Fetch technician's tasks from the API
  const fetchTasks = async () => {
    if (!technicianId) return null
    const res = await NitaApi.technicianDailyTasks(technicianId)
    if (!res.ok || !res.data) return []
    const payload = res.data as DailyTasksResponse
    return payload.tasks ?? []
  }

  const [tasks, setTasks] = useState<TechnicianTask[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    if (technicianId) loadTasks()
  }, [technicianId])

  const loadTasks = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await fetchTasks()
      setTasks(data)
    } catch (err) {
      setError(err as Error)
    } finally {
      setLoading(false)
    }
  }

  const handleAction = async (workOrderId: string, action: "start" | "done" | "decline" | "acknowledge") => {
    if (!user) return
    setActionLoading(workOrderId)
    try {
      const res = await NitaApi.technicianActions({
        work_order_id: workOrderId,
        technician_phone: user.phone_number,
        action,
      })
      if (res.ok) {
        toast.success(`Task ${action === "done" ? "completed" : action}d successfully`)
        await loadTasks()
      } else {
        toast.error(res.error || "Action failed")
      }
    } catch (err) {
      toast.error("Action failed")
    } finally {
      setActionLoading(null)
    }
  }

  const currentTasks = tasks?.filter((t) => t.status === "in_progress" || t.status === "assigned") ?? []
  const queueTasks = tasks?.filter((t) => t.status === "acknowledged" || t.status === "accepted") ?? []

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Welcome, {user?.full_name?.split(" ")[0]}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {currentTasks.length > 0
            ? `${currentTasks.length} active task${currentTasks.length > 1 ? "s" : ""}`
            : "No active tasks. Check your queue below."}
        </p>
        {/* Progress indicator */}
        {tasks && tasks.length > 0 && (
          <div className="mt-3 flex items-center gap-2">
            <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full bg-green-500 transition-all"
                style={{
                  width: `${((tasks.filter((t) => t.status === "completed").length) / tasks.length) * 100}%`,
                }}
              />
            </div>
            <span className="text-xs text-muted-foreground">
              {tasks.filter((t) => t.status === "completed").length}/{tasks.length} completed
            </span>
          </div>
        )}
      </div>

      {/* Current Tasks */}
      <section className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <PlayCircle className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Current Tasks</h2>
        </div>

        {loading ? (
          <ListSkeleton />
        ) : error ? (
          <ErrorState message={error.message} onRetry={loadTasks} />
        ) : currentTasks.length === 0 ? (
          <EmptyState title="No active tasks" description="Tasks you start will appear here." />
        ) : (
          <div className="flex flex-col gap-2">
            {currentTasks.map((task) => {
              const isLoading = actionLoading === task.work_order_id
              const canStart = task.status === "assigned"
              const canComplete = task.status === "in_progress"
              const canDecline = task.status === "assigned" || task.status === "acknowledged"

              return (
                <Card key={task.work_order_id} className="rounded-lg border-border bg-card p-4 transition-all hover-lift">
                  <div className="flex flex-col gap-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="truncate text-sm font-semibold">{task.asset_name ?? "Unknown asset"}</span>
                          {task.asset_code && (
                            <span className="shrink-0 font-mono text-xs text-muted-foreground">{task.asset_code}</span>
                          )}
                        </div>
                        <p className="mt-1 text-sm text-muted-foreground">{task.description || "No description"}</p>
                        <div className="mt-2 flex items-center gap-2">
                          {task.priority !== null && <PriorityBadge priority={task.priority as 0 | 1 | 2} />}
                          {task.asset_location && (
                            <span className="text-xs text-muted-foreground">{task.asset_location}</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {canStart && (
                        <Button
                          size="sm"
                          className="gap-2 rounded-lg"
                          disabled={isLoading}
                          onClick={() => handleAction(task.work_order_id, "start")}
                        >
                          <PlayCircle className="h-3 w-3" />
                          Start
                        </Button>
                      )}
                      {canComplete && (
                        <Button
                          size="sm"
                          className="gap-2 rounded-lg"
                          disabled={isLoading}
                          onClick={() => handleAction(task.work_order_id, "done")}
                        >
                          <CheckCircle className="h-3 w-3" />
                          Complete
                        </Button>
                      )}
                      {canDecline && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-2 rounded-lg"
                          disabled={isLoading}
                          onClick={() => handleAction(task.work_order_id, "decline")}
                        >
                          <XCircle className="h-3 w-3" />
                          Decline
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>
        )}
      </section>

      {/* Queue */}
      {queueTasks.length > 0 && (
        <section className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Queue ({queueTasks.length})
            </h2>
          </div>

          <div className="flex flex-col gap-2">
            {queueTasks.map((task) => {
              const isLoading = actionLoading === task.work_order_id

              return (
                <Card key={task.work_order_id} className="rounded-lg border-border bg-card p-4 transition-all hover-lift">
                  <div className="flex flex-col gap-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="truncate text-sm font-semibold">{task.asset_name ?? "Unknown asset"}</span>
                          {task.asset_code && (
                            <span className="shrink-0 font-mono text-xs text-muted-foreground">{task.asset_code}</span>
                          )}
                        </div>
                        <p className="mt-1 text-sm text-muted-foreground">{task.description || "No description"}</p>
                        <div className="mt-2 flex items-center gap-2">
                          {task.priority !== null && <PriorityBadge priority={task.priority as 0 | 1 | 2} />}
                          {task.asset_location && (
                            <span className="text-xs text-muted-foreground">{task.asset_location}</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {task.status === "acknowledged" && (
                        <Button
                          size="sm"
                          className="gap-2 rounded-lg"
                          disabled={isLoading}
                          onClick={() => handleAction(task.work_order_id, "acknowledge")}
                        >
                          <CheckCircle className="h-3 w-3" />
                          Accept
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-2 rounded-lg"
                        disabled={isLoading}
                        onClick={() => handleAction(task.work_order_id, "decline")}
                      >
                        <XCircle className="h-3 w-3" />
                        Decline
                      </Button>
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>
        </section>
      )}
    </div>
  )
}
