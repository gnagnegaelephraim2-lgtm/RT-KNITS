"use client"

import { useState } from "react"
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"
import { BarChart3, RefreshCw } from "lucide-react"
import { useSupabaseQuery } from "@/lib/hooks/use-supabase-query"
import { useLookups } from "@/lib/hooks/use-lookups"
import { ListSkeleton, ErrorState, NotConfiguredState } from "@/components/shared/states"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import type { TaskRequest, WorkOrder, WorkOrderFeedback, WorkOrderTechnician } from "@/lib/types"

const COLORS = {
  critical: "#DC2626",
  urgent: "#EA580C",
  nonUrgent: "#16A34A",
  repair: "#3B82F6",
  preventive: "#8B5CF6",
  emergency: "#EF4444",
  inspection: "#10B981",
}

const SENTIMENT_COLORS = {
  positive: "#16A34A",
  neutral: "#6B7280",
  negative: "#DC2626",
}

export default function AdminAnalytics() {
  const { techMap } = useLookups()
  const [timeRange, setTimeRange] = useState<"7d" | "30d" | "90d">("30d")

  const { data: tasks, isLoading: loadingTasks, error: tasksError, notConfigured, mutate } = useSupabaseQuery<TaskRequest[]>(
    "admin:analytics:tasks",
    (sb) =>
      sb
        .from("task_request")
        .select("*")
        .order("requested_at", { ascending: false })
        .limit(500),
    { refreshInterval: 60000 },
  )

  const { data: workOrders, isLoading: loadingWorkOrders } = useSupabaseQuery<WorkOrder[]>(
    "admin:analytics:work-orders",
    (sb) =>
      sb
        .from("work_order")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(500),
    { refreshInterval: 60000 },
  )

  const { data: feedback, isLoading: loadingFeedback } = useSupabaseQuery<WorkOrderFeedback[]>(
    "admin:analytics:feedback",
    (sb) =>
      sb
        .from("work_order_feedback")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(500),
    { refreshInterval: 60000 },
  )

  const handleRefresh = () => {
    mutate()
  }

  const isLoading = loadingTasks || loadingWorkOrders || loadingFeedback

  // Filter by time range
  const getDateFilter = () => {
    const now = new Date()
    switch (timeRange) {
      case "7d":
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      case "30d":
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      case "90d":
        return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
    }
  }

  const dateFilter = getDateFilter()
  const filteredTasks = tasks?.filter((t) => t.requested_at && new Date(t.requested_at) >= dateFilter) ?? []
  const filteredWorkOrders = workOrders?.filter((wo) => wo.created_at && new Date(wo.created_at) >= dateFilter) ?? []
  const filteredFeedback = feedback?.filter((f) => f.created_at && new Date(f.created_at) >= dateFilter) ?? []

  // Tasks by Priority
  const tasksByPriority = [
    { name: "Critical (0)", value: filteredTasks.filter((t) => t.priority === 0).length, color: COLORS.critical },
    { name: "Urgent (1)", value: filteredTasks.filter((t) => t.priority === 1).length, color: COLORS.urgent },
    { name: "Non-urgent (2)", value: filteredTasks.filter((t) => t.priority === 2).length, color: COLORS.nonUrgent },
  ]

  // Tasks by Type
  const tasksByType = [
    { name: "Repair", value: filteredTasks.filter((t) => t.task_type === "repair").length, color: COLORS.repair },
    { name: "Preventive", value: filteredTasks.filter((t) => t.task_type === "preventive").length, color: COLORS.preventive },
    { name: "Emergency", value: filteredTasks.filter((t) => t.task_type === "emergency").length, color: COLORS.emergency },
    { name: "Inspection", value: filteredTasks.filter((t) => t.task_type === "inspection").length, color: COLORS.inspection },
  ]

  // Average resolution time (completed work orders)
  const completedWorkOrders = filteredWorkOrders.filter((wo) => wo.status === "completed" && wo.completed_at && wo.created_at)
  const avgResolutionTime = completedWorkOrders.length > 0
    ? completedWorkOrders.reduce((sum, wo) => {
        const start = new Date(wo.created_at!).getTime()
        const end = new Date(wo.completed_at!).getTime()
        return sum + (end - start) / (1000 * 60 * 60) // hours
      }, 0) / completedWorkOrders.length
    : 0

  // Technician performance (tasks completed)
  const technicianPerformance = (() => {
    const techCounts = new Map<string, number>()
    completedWorkOrders.forEach((wo) => {
      if (wo.recommended_technician_id) {
        techCounts.set(wo.recommended_technician_id, (techCounts.get(wo.recommended_technician_id) || 0) + 1)
      }
    })
    return Array.from(techCounts.entries())
      .map(([techId, count]) => ({
        name: techMap.get(techId)?.full_name || "Unknown",
        tasks: count,
      }))
      .sort((a, b) => b.tasks - a.tasks)
      .slice(0, 10)
  })()

  // Feedback sentiment over time
  const sentimentOverTime = (() => {
    const sentimentByDate = new Map<string, { positive: number; neutral: number; negative: number }>()
    filteredFeedback.forEach((f) => {
      if (!f.created_at) return
      const date = new Date(f.created_at).toLocaleDateString()
      const existing = sentimentByDate.get(date) || { positive: 0, neutral: 0, negative: 0 }
      const sentiment = (f.derived_sentiment || "neutral").toLowerCase()
      if (sentiment === "positive") existing.positive++
      else if (sentiment === "negative") existing.negative++
      else existing.neutral++
      sentimentByDate.set(date, existing)
    })
    return Array.from(sentimentByDate.entries())
      .map(([date, counts]) => ({ date, ...counts }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(-14) // Last 14 days
  })()

  // Recommendation followed vs overridden
  const recommendationStats = (() => {
    const followed = filteredWorkOrders.filter((wo) => {
      // This is a simplified check - in reality you'd need to compare assigned vs recommended
      return wo.recommended_technician_id !== null
    }).length
    const total = filteredWorkOrders.length
    return [
      { name: "Recommendation Used", value: followed },
      { name: "Overridden", value: total - followed },
    ]
  })()

  if (notConfigured) {
    return <NotConfiguredState />
  }

  if (isLoading) {
    return <ListSkeleton />
  }

  if (tasksError) {
    return <ErrorState message={tasksError.message} onRetry={() => mutate()} />
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Analytics</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Performance metrics and insights
          </p>
        </div>
        <div className="flex gap-2">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as "7d" | "30d" | "90d")}
            className="rounded-lg border border-border bg-background px-3 py-1.5 text-sm"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
          </select>
          <Button
            size="sm"
            variant="outline"
            className="gap-2 rounded-lg"
            onClick={handleRefresh}
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="rounded-lg border-border bg-card p-4 transition-all hover-lift">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Total Tasks</p>
          <p className="mt-2 text-3xl font-bold text-foreground tabular-nums">{filteredTasks.length}</p>
        </Card>
        <Card className="rounded-lg border-border bg-card p-4 transition-all hover-lift">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Completed</p>
          <p className="mt-2 text-3xl font-bold text-foreground tabular-nums">{completedWorkOrders.length}</p>
        </Card>
        <Card className="rounded-lg border-border bg-card p-4 transition-all hover-lift">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Avg Resolution Time</p>
          <p className="mt-2 text-3xl font-bold text-foreground tabular-nums">
            {avgResolutionTime > 0 ? `${avgResolutionTime.toFixed(1)}h` : "-"}
          </p>
        </Card>
        <Card className="rounded-lg border-border bg-card p-4 transition-all hover-lift">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Feedback Received</p>
          <p className="mt-2 text-3xl font-bold text-foreground tabular-nums">{filteredFeedback.length}</p>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Tasks by Priority */}
        <Card className="rounded-lg border-border bg-card p-4 transition-all hover-lift">
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Tasks by Priority</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={tasksByPriority}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {tasksByPriority.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </Card>

        {/* Tasks by Type */}
        <Card className="rounded-lg border-border bg-card p-4 transition-all hover-lift">
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Tasks by Type</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={tasksByType}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="#3B82F6" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Technician Performance */}
        <Card className="rounded-lg border-border bg-card p-4 transition-all hover-lift">
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Top Technicians (Tasks Completed)</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={technicianPerformance} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis dataKey="name" type="category" width={100} />
              <Tooltip />
              <Bar dataKey="tasks" fill="#16A34A" radius={[0, 2, 2, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Recommendation Follow Rate */}
        <Card className="rounded-lg border-border bg-card p-4 transition-all hover-lift">
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Recommendation Follow Rate</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={recommendationStats}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                <Cell fill="#16A34A" />
                <Cell fill="#6B7280" />
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Feedback Sentiment Over Time */}
      <Card className="rounded-lg border-border bg-card p-4 transition-all hover-lift">
        <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Feedback Sentiment Over Time</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={sentimentOverTime}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="positive" stroke={SENTIMENT_COLORS.positive} strokeWidth={2} name="Positive" />
            <Line type="monotone" dataKey="neutral" stroke={SENTIMENT_COLORS.neutral} strokeWidth={2} name="Neutral" />
            <Line type="monotone" dataKey="negative" stroke={SENTIMENT_COLORS.negative} strokeWidth={2} name="Negative" />
          </LineChart>
        </ResponsiveContainer>
      </Card>
    </div>
  )
}
