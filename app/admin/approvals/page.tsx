"use client"

import { useState, useEffect } from "react"
import { Inbox, CheckCircle, XCircle, User, Wrench, RefreshCw } from "lucide-react"
import { NitaApi } from "@/lib/api"
import { useLookups } from "@/lib/hooks/use-lookups"
import { PriorityBadge } from "@/components/shared/badges"
import { ForwardMediaButton } from "@/components/shared/forward-media-button"
import { ListSkeleton, EmptyState, ErrorState } from "@/components/shared/states"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { toast } from "sonner"
import type { TaskRequest, Technician } from "@/lib/types"

interface PendingApproval {
  task_request_id: string
  asset_id: string | null
  status: string
  priority: number
  requested_at: string | null
  description: string | null
  task_type: string | null
  required_trade: string | null
  created_by_user_id: string | null
  created_by_role: string | null
  media_urls: string[] | null
  asset_name?: string
  asset_code?: string
  asset_location?: string
  reporter_name?: string
}

interface TechnicianRecommendation {
  technician_id: string
  full_name: string
  trade: string
  score: number
  score_description: string
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

export default function AdminApprovals() {
  const { assetMap, userMap, technicians } = useLookups()
  const [approvals, setApprovals] = useState<PendingApproval[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [selectedTask, setSelectedTask] = useState<PendingApproval | null>(null)
  const [recommendation, setRecommendation] = useState<TechnicianRecommendation | null>(null)
  const [loadingRecommendation, setLoadingRecommendation] = useState(false)
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false)
  const [rejectReason, setRejectReason] = useState("")
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const fetchApprovals = async () => {
    try {
      const res = await NitaApi.pendingApprovals()
      if (res.ok && res.data) {
        const raw = Array.isArray(res.data) ? res.data : [res.data]
        const enriched = (raw as any[]).map((t) => ({
          ...t,
          asset_name: t.asset_id ? assetMap.get(t.asset_id)?.name : undefined,
          asset_code: t.asset_id ? assetMap.get(t.asset_id)?.asset_code : undefined,
          asset_location: t.asset_id ? assetMap.get(t.asset_id)?.location : undefined,
          reporter_name: t.created_by_user_id ? userMap.get(t.created_by_user_id)?.full_name : undefined,
        }))
        setApprovals(enriched)
      }
    } catch (err) {
      toast.error("Failed to load pending approvals")
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchApprovals()
  }, [assetMap, userMap])

  const fetchRecommendation = async (task: PendingApproval) => {
    if (!task.required_trade) return
    setLoadingRecommendation(true)
    try {
      const res = await NitaApi.recommendTechnician(task.required_trade)
      if (res.ok && res.data) {
        setRecommendation(res.data as TechnicianRecommendation)
      }
    } catch (err) {
      toast.error("Failed to load technician recommendation")
    } finally {
      setLoadingRecommendation(false)
    }
  }

  const handleTaskClick = (task: PendingApproval) => {
    setSelectedTask(task)
    setRecommendation(null)
    if (task.required_trade) {
      fetchRecommendation(task)
    }
  }

  const handleApprove = async (technicianId?: string) => {
    if (!selectedTask) return
    setActionLoading(selectedTask.task_request_id)
    try {
      const res = await NitaApi.taskLifecycle({
        action: "approve",
        task_request_id: selectedTask.task_request_id,
        technician_id: technicianId || recommendation?.technician_id,
      })
      if (res.ok) {
        toast.success("Task approved successfully")
        setSelectedTask(null)
        setRecommendation(null)
        fetchApprovals()
      } else {
        toast.error(res.error || "Failed to approve task")
      }
    } catch (err) {
      toast.error("Failed to approve task")
    } finally {
      setActionLoading(null)
    }
  }

  const handleReject = async () => {
    if (!selectedTask || !rejectReason.trim()) {
      toast.error("Please provide a rejection reason")
      return
    }
    setActionLoading(selectedTask.task_request_id)
    try {
      const res = await NitaApi.taskLifecycle({
        action: "reject",
        task_request_id: selectedTask.task_request_id,
        rejection_reason: rejectReason,
      })
      if (res.ok) {
        toast.success("Task rejected")
        setSelectedTask(null)
        setRejectDialogOpen(false)
        setRejectReason("")
        fetchApprovals()
      } else {
        toast.error(res.error || "Failed to reject task")
      }
    } catch (err) {
      toast.error("Failed to reject task")
    } finally {
      setActionLoading(null)
    }
  }

  const handleRefresh = () => {
    setRefreshing(true)
    fetchApprovals()
  }

  const eligibleTechnicians = technicians.filter(
    (t) => t.active && (!selectedTask?.required_trade || t.trade === selectedTask.required_trade)
  )

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Approval Queue</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Review and approve incoming maintenance requests
          </p>
        </div>
        <Button
          size="sm"
          variant="outline"
          className="gap-2 rounded-md"
          disabled={refreshing}
          onClick={handleRefresh}
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      <section className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <Inbox className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            {approvals.length} pending{approvals.length !== 1 ? "s" : ""}
          </h2>
        </div>

        {loading ? (
          <ListSkeleton />
        ) : approvals.length === 0 ? (
          <EmptyState title="No pending approvals" description="All caught up! New requests will appear here." />
        ) : (
          <div className="flex flex-col gap-2">
            {approvals.map((task) => (
              <button
                key={task.task_request_id}
                onClick={() => handleTaskClick(task)}
                className="group flex items-center gap-3 border border-border bg-card p-4 text-left transition-all hover:border-primary hover-lift"
                style={{ borderLeftWidth: "3px", borderLeftColor: task.priority === 0 ? "#DC2626" : task.priority === 1 ? "#EA580C" : "#16A34A" }}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-sm font-semibold">{task.asset_name ?? "Unknown asset"}</span>
                    {task.asset_code && (
                      <span className="shrink-0 font-mono text-xs text-muted-foreground">{task.asset_code}</span>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{task.description || "No description"}</p>
                  <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <User className="h-3 w-3" />
                      {task.reporter_name ?? "Unknown"}
                    </span>
                    <span>{timeAgo(task.requested_at)}</span>
                    {task.required_trade && (
                      <span className="flex items-center gap-1">
                        <Wrench className="h-3 w-3" />
                        {task.required_trade}
                      </span>
                    )}
                  </div>
                </div>
                <PriorityBadge priority={task.priority as 0 | 1 | 2} />
              </button>
            ))}
          </div>
        )}
      </section>

      {/* Task Detail Dialog */}
      <Dialog open={!!selectedTask} onOpenChange={(open) => !open && setSelectedTask(null)}>
        <DialogContent className="max-w-2xl rounded-lg">
          {selectedTask && (
            <>
              <DialogHeader>
                <DialogTitle className="text-lg font-semibold">Review Request</DialogTitle>
              </DialogHeader>

              <div className="flex flex-col gap-4">
                <Card className="rounded-md border-border bg-muted/30 p-4">
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold">{selectedTask.asset_name ?? "Unknown asset"}</p>
                        {selectedTask.asset_code && (
                          <p className="text-xs text-muted-foreground font-mono">{selectedTask.asset_code}</p>
                        )}
                      </div>
                      <PriorityBadge priority={selectedTask.priority as 0 | 1 | 2} />
                    </div>

                    <p className="text-sm text-muted-foreground">{selectedTask.description || "No description"}</p>

                    <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                      <span>Reporter: {selectedTask.reporter_name ?? "Unknown"}</span>
                      <span>Type: {selectedTask.task_type ?? "Not specified"}</span>
                      <span>Trade: {selectedTask.required_trade ?? "Not specified"}</span>
                      <span>{timeAgo(selectedTask.requested_at)}</span>
                    </div>

                    {selectedTask.media_urls && selectedTask.media_urls.length > 0 && (
                      <div className="mt-2">
                        <ForwardMediaButton taskId={selectedTask.task_request_id} />
                      </div>
                    )}
                  </div>
                </Card>

                {/* AI Recommendation */}
                {selectedTask.required_trade && (
                  <Card className="rounded-lg border-border bg-card p-4">
                    <div className="mb-3 flex items-center gap-2">
                      <Wrench className="h-4 w-4 text-primary" />
                      <h3 className="text-sm font-semibold">AI Technician Recommendation</h3>
                    </div>

                    {loadingRecommendation ? (
                      <p className="text-sm text-muted-foreground">Loading recommendation...</p>
                    ) : recommendation ? (
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium">{recommendation.full_name}</p>
                            <p className="text-xs text-muted-foreground">
                              {recommendation.trade} &middot; Score: {recommendation.score}/100
                            </p>
                          </div>
                          <span className="rounded-md bg-green-100 px-2 py-1 text-xs font-medium text-green-700 shadow-sm">
                            Recommended
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground">{recommendation.score_description}</p>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">No recommendation available</p>
                    )}
                  </Card>
                )}

                {/* Technician Override */}
                <Card className="rounded-lg border-border bg-card p-4">
                  <div className="mb-3 flex items-center gap-2">
                    <User className="h-4 w-4 text-primary" />
                    <h3 className="text-sm font-semibold">Assign Technician</h3>
                  </div>

                  <select
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                    defaultValue={recommendation?.technician_id}
                  >
                    {eligibleTechnicians.length === 0 ? (
                      <option value="">No eligible technicians</option>
                    ) : (
                      <>
                        <option value="">Select a technician...</option>
                        {eligibleTechnicians.map((tech) => (
                          <option key={tech.technician_id} value={tech.technician_id}>
                            {tech.full_name} ({tech.trade})
                          </option>
                        ))}
                      </>
                    )}
                  </select>
                </Card>

                {/* Actions */}
                <div className="flex gap-3">
                  <Button
                    size="lg"
                    className="flex-1 gap-2 rounded-lg"
                    disabled={actionLoading === selectedTask.task_request_id}
                    onClick={() => {
                      const select = document.querySelector("select") as HTMLSelectElement
                      handleApprove(select?.value)
                    }}
                  >
                    <CheckCircle className="h-4 w-4" />
                    Approve
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    className="flex-1 gap-2 rounded-lg"
                    disabled={actionLoading === selectedTask.task_request_id}
                    onClick={() => setRejectDialogOpen(true)}
                  >
                    <XCircle className="h-4 w-4" />
                    Reject
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent className="max-w-md rounded-lg">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold">Reject Request</DialogTitle>
          </DialogHeader>

          <div className="flex flex-col gap-4">
            <p className="text-sm text-muted-foreground">
              Please provide a reason for rejecting this request. This will be communicated to the reporter.
            </p>

            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Enter rejection reason..."
              className="min-h-[100px] rounded-lg border border-border bg-background px-3 py-2 text-sm"
            />

            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1 rounded-lg"
                onClick={() => setRejectDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                className="flex-1 gap-2 rounded-lg bg-red-600 text-white hover:bg-red-700"
                disabled={actionLoading === selectedTask?.task_request_id || !rejectReason.trim()}
                onClick={handleReject}
              >
                <XCircle className="h-4 w-4" />
                Confirm Reject
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
