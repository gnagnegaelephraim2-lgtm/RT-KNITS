"use client"

import { useState } from "react"
import { Star, Send, MessageSquare, CheckCircle2 } from "lucide-react"
import { toast } from "sonner"
import { useAuth } from "@/components/auth/auth-provider"
import { useSupabaseQuery } from "@/lib/hooks/use-supabase-query"
import { useLookups } from "@/lib/hooks/use-lookups"
import { NitaApi } from "@/lib/api"
import { StatusBadge } from "@/components/shared/badges"
import { ListSkeleton, EmptyState, ErrorState, NotConfiguredState } from "@/components/shared/states"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import type { WorkOrder, TaskRequest } from "@/lib/types"

interface CompletedRow extends WorkOrder {
  task_request: TaskRequest | null
}

export default function OperatorFeedback() {
  const { user } = useAuth()
  const { assetMap } = useLookups()
  const [selected, setSelected] = useState<CompletedRow | null>(null)
  const [rating, setRating] = useState(0)
  const [text, setText] = useState("")
  const [submitting, setSubmitting] = useState(false)

  // Completed work orders originating from this operator's requests.
  const { data, isLoading, error, notConfigured, mutate } = useSupabaseQuery<CompletedRow[]>(
    user ? `operator:completed:${user.user_id}` : null,
    (sb) =>
      sb
        .from("work_order")
        .select("*, task_request!inner(*)")
        .eq("status", "completed")
        .eq("task_request.created_by_user_id", user!.user_id)
        .order("completed_at", { ascending: false }),
    { refreshInterval: 30000 },
  )

  const rows = data ?? []

  async function submit() {
    if (!selected || rating === 0 || !user) return
    setSubmitting(true)
    const res = await NitaApi.feedback({
      work_order_id: selected.work_order_id,
      rated_by_user_id: user.user_id,
      feedback_type: "text",
      feedback_text: text.trim() || null,
      derived_rating: rating,
    })
    setSubmitting(false)
    if (res.ok) {
      toast.success("Thanks for your feedback!")
      setSelected(null)
      setRating(0)
      setText("")
      mutate()
    } else {
      toast.error("Could not submit feedback", { description: res.error ?? `Error ${res.status}` })
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Rate a Repair</h1>
        <p className="mt-1 text-sm text-muted-foreground">Tell us how the last completed repairs went.</p>
      </div>

      {selected ? (
        <Card className="flex flex-col gap-4 rounded-lg p-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Repair</p>
            <p className="mt-1 font-semibold">
              {selected.task_request?.asset_id ? assetMap.get(selected.task_request.asset_id)?.name ?? "Asset" : "Asset"}
            </p>
            <p className="text-sm text-muted-foreground text-pretty">{selected.task_request?.description}</p>
          </div>

          <div>
            <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Your rating</p>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((n) => (
                <button key={n} onClick={() => setRating(n)} aria-label={`${n} star${n > 1 ? "s" : ""}`}>
                  <Star
                    className={cn(
                      "h-8 w-8 transition-colors",
                      n <= rating ? "fill-[#EA580C] text-[#EA580C]" : "text-muted-foreground/40",
                    )}
                  />
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Comments (optional)
            </p>
            <Textarea
              className="min-h-20 rounded-md"
              placeholder="Anything the technician did well or could improve?"
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
          </div>

          <div className="flex gap-2">
            <Button variant="outline" className="rounded-md" onClick={() => setSelected(null)}>
              Cancel
            </Button>
            <Button className="flex-1 gap-2 rounded-md" disabled={rating === 0 || submitting} onClick={submit}>
              <Send className="h-4 w-4" />
              {submitting ? "Sending..." : "Submit Feedback"}
            </Button>
          </div>
        </Card>
      ) : notConfigured ? (
        <NotConfiguredState />
      ) : isLoading ? (
        <ListSkeleton />
      ) : error ? (
        <ErrorState message={error.message} onRetry={() => mutate()} />
      ) : rows.length === 0 ? (
        <EmptyState
          icon={<MessageSquare className="h-8 w-8" />}
          title="No completed repairs yet"
          description="Once a repair you reported is completed, you can rate it here."
        />
      ) : (
        <div className="flex flex-col gap-2">
          {rows.map((r) => (
            <button
              key={r.work_order_id}
              onClick={() => setSelected(r)}
              className="flex items-center gap-3 border border-border bg-card p-3 text-left transition-colors hover:border-primary"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-md bg-[#16A34A]/10 text-[#16A34A]">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">
                  {r.task_request?.asset_id ? assetMap.get(r.task_request.asset_id)?.name ?? "Asset" : "Asset"}
                </p>
                <p className="truncate text-sm text-muted-foreground">{r.task_request?.description}</p>
              </div>
              <StatusBadge status={r.status} />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
