"use client"

import { Paperclip, ImageIcon, Video, Mic, FileText, X } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { PriorityBadge, StatusBadge } from "@/components/shared/badges"
import { ForwardMediaButton } from "@/components/shared/forward-media-button"
import { useT } from "@/lib/i18n/i18n-provider"
import type { TaskRequest, MediaEntry } from "@/lib/types"

function fmt(dt: string | null | undefined) {
  if (!dt) return "—"
  const d = new Date(dt)
  if (Number.isNaN(d.getTime())) return "—"
  return d.toLocaleString()
}

function mediaIcon(type: string) {
  const t = type.toLowerCase()
  if (t.includes("image") || t.includes("photo")) return <ImageIcon className="h-4 w-4" />
  if (t.includes("video")) return <Video className="h-4 w-4" />
  if (t.includes("audio") || t.includes("voice")) return <Mic className="h-4 w-4" />
  return <FileText className="h-4 w-4" />
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5 border-b border-border py-2 last:border-b-0">
      <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</span>
      <span className="text-sm text-foreground">{value}</span>
    </div>
  )
}

export function TaskDetailDialog({
  task,
  open,
  onOpenChange,
  assetLabel,
  assetLocation,
  reporterName,
  assignedTechnician,
  canForwardMedia = false,
  onCancel,
  cancelling = false,
}: {
  task: TaskRequest | null
  open: boolean
  onOpenChange: (v: boolean) => void
  assetLabel?: string
  assetLocation?: string
  reporterName?: string
  assignedTechnician?: string
  canForwardMedia?: boolean
  onCancel?: () => void
  cancelling?: boolean
}) {
  const t = useT()
  if (!task) return null
  const media: MediaEntry[] = Array.isArray(task.media_urls) ? task.media_urls : []

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] max-w-lg overflow-y-auto rounded-lg sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="pr-8">{t("taskDetail.title")}</DialogTitle>
        </DialogHeader>

        <div className="flex flex-wrap items-center gap-2">
          <PriorityBadge priority={task.priority} />
          <StatusBadge status={task.status} />
          {task.task_type && (
            <span className="border border-border px-2 py-0.5 text-xs font-medium capitalize text-muted-foreground">
              {task.task_type}
            </span>
          )}
        </div>

        <div className="mt-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t("taskDetail.description")}</p>
          <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-foreground text-pretty">
            {task.description || t("taskDetail.noDescription")}
          </p>
        </div>

        <div>
          <Row label={t("taskDetail.asset")} value={assetLabel ?? task.asset_id ?? "—"} />
          {assetLocation && <Row label={t("taskDetail.location")} value={assetLocation} />}
          <Row label={t("taskDetail.requiredTrade")} value={task.required_trade ?? "—"} />
          <Row label={t("taskDetail.reportedBy")} value={reporterName ?? task.created_by_role ?? "—"} />
          <Row label={t("taskDetail.requested")} value={fmt(task.requested_at)} />
          {assignedTechnician && <Row label={t("taskDetail.assignedTechnician")} value={assignedTechnician} />}
          {task.status === "approved" && <Row label={t("taskDetail.approved")} value={fmt(task.approved_at)} />}
          {task.status === "rejected" && (
            <Row
              label={t("taskDetail.rejectionReason")}
              value={<span className="text-[#DC2626]">{task.rejection_reason || t("taskDetail.noReasonGiven")}</span>}
            />
          )}
        </div>

        {media.length > 0 && (
          <div className="mt-1">
            <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              <Paperclip className="h-3.5 w-3.5" />
              {t("taskDetail.mediaAttachment", { count: media.length })}
            </p>
            <div className="flex flex-col gap-2">
              {media.map((m, i) => (
                <div key={i} className="flex items-start gap-2 border border-border bg-muted/40 p-2">
                  <span className="mt-0.5 text-muted-foreground">{mediaIcon(m.type)}</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium capitalize text-foreground">{t("taskDetail.attachment", { type: m.type })}</p>
                    {m.caption && <p className="mt-0.5 text-sm text-muted-foreground text-pretty">{m.caption}</p>}
                    <p className="mt-0.5 text-xs text-muted-foreground">{t("taskDetail.mediaNotViewable")}</p>
                  </div>
                </div>
              ))}
            </div>
            {canForwardMedia && (
              <div className="mt-2">
                <ForwardMediaButton taskId={task.task_request_id} />
              </div>
            )}
          </div>
        )}

        {onCancel && task.status === "pending_approval" && (
          <Button
            variant="outline"
            className="mt-1 gap-2 rounded-md text-[#DC2626] hover:text-[#DC2626]"
            disabled={cancelling}
            onClick={onCancel}
          >
            <X className="h-4 w-4" />
            {cancelling ? t("operator.home.cancelling") : t("operator.home.cancelReport")}
          </Button>
        )}
      </DialogContent>
    </Dialog>
  )
}
