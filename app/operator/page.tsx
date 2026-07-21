"use client"

import { useState } from "react"
import Link from "next/link"
import { Plus, ClipboardList, MessageSquare } from "lucide-react"
import { toast } from "sonner"
import { useAuth } from "@/components/auth/auth-provider"
import { useSupabaseQuery } from "@/lib/hooks/use-supabase-query"
import { useLookups } from "@/lib/hooks/use-lookups"
import { useT } from "@/lib/i18n/i18n-provider"
import { NitaApi } from "@/lib/api"
import { TaskDetailDialog } from "@/components/shared/task-detail-dialog"
import { PriorityBadge, StatusBadge } from "@/components/shared/badges"
import { ListSkeleton, EmptyState, ErrorState, NotConfiguredState } from "@/components/shared/states"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import type { TaskRequest } from "@/lib/types"

interface OperatorTaskRequest extends TaskRequest {
  work_order?: Array<{
    work_order_technician: Array<{ technician_id: string; status: string }>
  }>
}

function timeAgo(dt: string | null | undefined, t: (key: string, vars?: Record<string, string | number>) => string) {
  if (!dt) return ""
  const d = new Date(dt).getTime()
  if (Number.isNaN(d)) return ""
  const diff = Date.now() - d
  const mins = Math.round(diff / 60000)
  if (mins < 1) return t("common.justNow")
  if (mins < 60) return t("common.minutesAgo", { count: mins })
  const hrs = Math.round(mins / 60)
  if (hrs < 24) return t("common.hoursAgo", { count: hrs })
  return t("common.daysAgo", { count: Math.round(hrs / 24) })
}

export default function OperatorHome() {
  const { user } = useAuth()
  const t = useT()
  const [active, setActive] = useState<OperatorTaskRequest | null>(null)
  const [cancelling, setCancelling] = useState(false)
  const { assetMap, techMap } = useLookups()

  const { data, isLoading, error, notConfigured, mutate } = useSupabaseQuery<OperatorTaskRequest[]>(
    user ? `operator:tasks:${user.user_id}` : null,
    (sb) =>
      sb
        .from("task_request")
        .select("*, work_order(work_order_technician(technician_id, status))")
        .eq("created_by_user_id", user!.user_id)
        .order("requested_at", { ascending: false }),
    { refreshInterval: 20000 },
  )

  const tasks = data ?? []
  const openCount = tasks.filter((t) => t.status === "pending_approval" || t.status === "approved").length

  function assignedTechnicianFor(task: OperatorTaskRequest | null): string | undefined {
    const link = task?.work_order?.[0]?.work_order_technician?.[0]
    if (!link) return undefined
    return techMap.get(link.technician_id)?.full_name
  }

  async function cancelActive() {
    if (!active) return
    setCancelling(true)
    const res = await NitaApi.taskLifecycle({
      action: "reject",
      task_request_id: active.task_request_id,
      rejection_reason: "Cancelled by reporter",
    })
    setCancelling(false)
    if (res.ok) {
      toast.success(t("operator.home.cancelSuccess"))
      setActive(null)
      mutate()
    } else {
      toast.error(t("operator.home.cancelFailed"), { description: res.error ?? `Error ${res.status}` })
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-balance">
            {t("operator.home.welcome", { name: user?.full_name?.split(" ")[0] ?? "" })}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {openCount > 0 ? t("operator.home.activeReports", { count: openCount }) : t("operator.home.reportIssueSubtitle")}
          </p>
        </div>
        <Button size="lg" className="gap-2 rounded-md" render={<Link href="/operator/report" />} nativeButton={false}>
          <Plus className="h-4 w-4" />
          {t("operator.home.newReport")}
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Link href="/operator/report">
          <Card className="flex items-center gap-3 rounded-lg p-4 transition-all hover-lift hover:border-primary">
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Plus className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold">{t("operator.home.reportIssue")}</p>
              <p className="text-xs text-muted-foreground">{t("operator.home.logBreakdown")}</p>
            </div>
          </Card>
        </Link>
        <Link href="/operator/feedback">
          <Card className="flex items-center gap-3 rounded-lg p-4 transition-all hover-lift hover:border-primary">
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <MessageSquare className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold">{t("operator.home.giveFeedback")}</p>
              <p className="text-xs text-muted-foreground">{t("operator.home.rateRepair")}</p>
            </div>
          </Card>
        </Link>
      </div>

      <section className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <ClipboardList className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">{t("operator.home.myReports")}</h2>
        </div>

        {notConfigured ? (
          <NotConfiguredState />
        ) : isLoading ? (
          <ListSkeleton />
        ) : error ? (
          <ErrorState message={error.message} onRetry={() => mutate()} />
        ) : tasks.length === 0 ? (
          <EmptyState
            title={t("operator.home.noReportsTitle")}
            description={t("operator.home.noReportsDescription")}
            action={
              <Button className="gap-2 rounded-md" render={<Link href="/operator/report" />} nativeButton={false}>
                <Plus className="h-4 w-4" />
                {t("operator.home.reportAnIssue")}
              </Button>
            }
          />
        ) : (
          <div className="flex flex-col gap-2">
            {tasks.map((task) => {
              const asset = task.asset_id ? assetMap.get(task.asset_id) : undefined
              return (
                <button
                  key={task.task_request_id}
                  onClick={() => setActive(task)}
                  className="group flex items-center gap-3 border border-border bg-card p-3 text-left transition-all hover:border-primary hover-lift"
                  style={{ borderLeftWidth: "3px", borderLeftColor: task.priority === 0 ? "#DC2626" : task.priority === 1 ? "#EA580C" : "#16A34A" }}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-sm font-semibold">{asset?.name ?? t("operator.home.unknownAsset")}</span>
                      {asset?.asset_code && (
                        <span className="shrink-0 font-mono text-xs text-muted-foreground">{asset.asset_code}</span>
                      )}
                    </div>
                    <p className="mt-0.5 truncate text-sm text-muted-foreground">{task.description || t("operator.home.noDescription")}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{timeAgo(task.requested_at, t)}</p>
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
        reporterName={user?.full_name}
        assignedTechnician={assignedTechnicianFor(active)}
        onCancel={active?.status === "pending_approval" ? cancelActive : undefined}
        cancelling={cancelling}
      />
    </div>
  )
}
