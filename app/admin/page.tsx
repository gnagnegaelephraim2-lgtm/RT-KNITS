"use client"

import { useState, useEffect } from "react"
import { LayoutDashboard, Clock, AlertTriangle, HardHat, RefreshCw } from "lucide-react"
import { NitaApi } from "@/lib/api"
import { useLookups } from "@/lib/hooks/use-lookups"
import { PriorityBadge } from "@/components/shared/badges"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { KPICard } from "@/components/admin/kpi-card"
import { KanbanBoard } from "@/components/admin/kanban-board"
import { toast } from "sonner"

interface AdminStatus {
  pending_approvals: number
  in_progress: number
  critical_active: number
  active_technicians: number
}

interface KanbanTask {
  task_request_id: string
  asset_id: string | null
  status: string
  priority: number
  requested_at: string | null
  description: string | null
  created_by_user_id: string | null
  work_order_id?: string
  asset_name?: string
  asset_code?: string
  reporter_name?: string
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

export default function AdminDashboard() {
  const { assetMap, userMap } = useLookups()
  const [status, setStatus] = useState<AdminStatus | null>(null)
  const [tasks, setTasks] = useState<KanbanTask[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const fetchData = async () => {
    try {
      const [statusRes, tasksRes] = await Promise.all([
        NitaApi.adminStatus(),
        NitaApi.adminRead("task_request", { limit: 50 }),
      ])

      if (statusRes.ok && statusRes.data) {
        setStatus(statusRes.data as AdminStatus)
      }

      if (tasksRes.ok && tasksRes.data) {
        const rawTasks = Array.isArray(tasksRes.data) ? tasksRes.data : [tasksRes.data]
        const enrichedTasks = (rawTasks as any[]).map((t) => ({
          ...t,
          asset_name: t.asset_id ? assetMap.get(t.asset_id)?.name : undefined,
          asset_code: t.asset_id ? assetMap.get(t.asset_id)?.asset_code : undefined,
          reporter_name: t.created_by_user_id ? userMap.get(t.created_by_user_id)?.full_name : undefined,
        }))
        setTasks(enrichedTasks)
      }
    } catch (err) {
      toast.error("Failed to load dashboard data")
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [assetMap, userMap])

  const handleRefresh = () => {
    setRefreshing(true)
    fetchData()
  }

  const today = new Date().toISOString().split("T")[0]

  const columns = [
    {
      id: "pending_approval",
      title: "Pending Approval",
      tasks: tasks.filter((t) => t.status === "pending_approval"),
      color: "border-amber-500",
    },
    {
      id: "assigned",
      title: "Assigned",
      tasks: tasks.filter((t) => t.status === "approved"),
      color: "border-blue-500",
    },
    {
      id: "in_progress",
      title: "In Progress",
      tasks: tasks.filter((t) => {
        const wo = tasks.find((wo) => wo.task_request_id === t.task_request_id)
        return wo?.status === "in_progress"
      }),
      color: "border-orange-500",
    },
    {
      id: "completed_today",
      title: "Completed Today",
      tasks: tasks.filter((t) => t.status === "approved" && t.requested_at?.startsWith(today)),
      color: "border-green-500",
    },
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-sm text-muted-foreground">Loading dashboard...</div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="mt-1 text-sm text-muted-foreground">Real-time overview of maintenance operations</p>
        </div>
        <Button
          size="sm"
          variant="outline"
          className="gap-2 rounded-lg"
          disabled={refreshing}
          onClick={handleRefresh}
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KPICard
          title="Pending Approvals"
          value={status?.pending_approvals ?? 0}
          icon={Clock}
          iconColor="text-amber-600"
          iconBgColor="bg-amber-50"
        />
        <KPICard
          title="In Progress"
          value={status?.in_progress ?? 0}
          icon={LayoutDashboard}
          iconColor="text-orange-600"
          iconBgColor="bg-orange-50"
        />
        <KPICard
          title="Critical Active"
          value={status?.critical_active ?? 0}
          icon={AlertTriangle}
          iconColor="text-red-600"
          iconBgColor="bg-red-50"
        />
        <KPICard
          title="Active Technicians"
          value={status?.active_technicians ?? 0}
          icon={HardHat}
          iconColor="text-blue-600"
          iconBgColor="bg-blue-50"
        />
      </div>

      {/* Kanban Board */}
      <KanbanBoard
        columns={columns}
        renderTask={(task) => (
          <div className="flex flex-col gap-2">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="truncate text-xs font-semibold">{task.asset_name ?? "Unknown"}</span>
                  {task.asset_code && (
                    <span className="shrink-0 font-mono text-[10px] text-muted-foreground">
                      {task.asset_code}
                    </span>
                  )}
                </div>
                <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                  {task.description || "No description"}
                </p>
              </div>
              <PriorityBadge priority={task.priority as 0 | 1 | 2} />
            </div>

            <div className="flex items-center justify-between text-[10px] text-muted-foreground">
              <span>{task.reporter_name ?? "Unknown"}</span>
              <span>{timeAgo(task.requested_at)}</span>
            </div>
          </div>
        )}
      />
    </div>
  )
}
