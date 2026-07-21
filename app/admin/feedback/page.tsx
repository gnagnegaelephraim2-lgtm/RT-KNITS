"use client"

import { useState } from "react"
import { MessageSquareText, RefreshCw, Star } from "lucide-react"
import { useSupabaseQuery } from "@/lib/hooks/use-supabase-query"
import { useLookups } from "@/lib/hooks/use-lookups"
import { ListSkeleton, EmptyState, ErrorState, NotConfiguredState } from "@/components/shared/states"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { FeedbackCard } from "@/components/admin/feedback-card"
import { FilterBar } from "@/components/admin/filter-bar"
import { toast } from "sonner"
import type { WorkOrderFeedback } from "@/lib/types"

interface FeedbackWithDetails extends WorkOrderFeedback {
  work_order_asset_name?: string
  work_order_asset_code?: string
  rater_name?: string
  technician_name?: string
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

function getSentimentColor(sentiment: string | null) {
  if (!sentiment) return "text-muted-foreground"
  switch (sentiment.toLowerCase()) {
    case "positive":
      return "text-green-600"
    case "negative":
      return "text-red-600"
    case "neutral":
      return "text-gray-600"
    default:
      return "text-muted-foreground"
  }
}

function getRatingStars(rating: number | null) {
  if (!rating) return null
  const stars = []
  for (let i = 1; i <= 5; i++) {
    stars.push(
      <Star
        key={i}
        className={`h-3 w-3 ${i <= rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`}
      />
    )
  }
  return stars
}

export default function AdminFeedback() {
  const { userMap, techMap } = useLookups()
  const [searchQuery, setSearchQuery] = useState("")
  const [filterFlagged, setFilterFlagged] = useState(false)
  const [selectedFeedback, setSelectedFeedback] = useState<FeedbackWithDetails | null>(null)

  const { data, isLoading, error, notConfigured, mutate } = useSupabaseQuery<WorkOrderFeedback[]>(
    "admin:feedback",
    (sb) =>
      sb
        .from("work_order_feedback")
        .select("*")
        .order("created_at", { ascending: false }),
    { refreshInterval: 30000 },
  )

  const handleRefresh = () => {
    mutate()
  }

  const handleMarkReviewed = async (feedbackId: string) => {
    try {
      const sb = (await import("@/lib/supabase/client")).getSupabaseBrowser()
      if (!sb) {
        toast.error("Database not configured")
        return
      }

      const { error } = await sb
        .from("work_order_feedback")
        .update({ reviewed_by_user_id: (await import("@/components/auth/auth-provider")).useAuth().user?.user_id, reviewed_at: new Date().toISOString() })
        .eq("feedback_id", feedbackId)

      if (error) throw error
      toast.success("Feedback marked as reviewed")
      mutate()
    } catch (err) {
      toast.error("Failed to mark as reviewed")
    }
  }

  const feedback = data ?? []

  // Enrich feedback with related data
  const enrichedFeedback = feedback.map((f) => ({
    ...f,
    rater_name: f.rated_by_user_id ? userMap.get(f.rated_by_user_id)?.full_name : undefined,
    technician_name: f.work_order_id ? techMap.get(f.work_order_id)?.full_name : undefined,
  })) as FeedbackWithDetails[]

  const filteredFeedback = enrichedFeedback.filter((f) => {
    const matchesSearch =
      !searchQuery ||
      f.feedback_text?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.rater_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.technician_name?.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesFlagged = !filterFlagged || f.flagged_for_review

    return matchesSearch && matchesFlagged
  })

  // Sort: flagged first, then by date
  const sortedFeedback = [...filteredFeedback].sort((a, b) => {
    if (a.flagged_for_review && !b.flagged_for_review) return -1
    if (!a.flagged_for_review && b.flagged_for_review) return 1
    return new Date(b.created_at || "").getTime() - new Date(a.created_at || "").getTime()
  })

  const flaggedCount = feedback.filter((f) => f.flagged_for_review).length
  const avgRating = feedback.length > 0
    ? feedback.reduce((sum, f) => sum + (f.derived_rating || 0), 0) / feedback.length
    : 0

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Feedback Review</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Review operator feedback on completed tasks ({flaggedCount} flagged for review · Avg rating: {avgRating.toFixed(1)}/5)
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
        searchPlaceholder="Search by feedback text, rater, or technician..."
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        actions={
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={filterFlagged}
              onChange={(e) => setFilterFlagged(e.target.checked)}
              className="rounded-md"
            />
            Show only flagged
          </label>
        }
      />

      {/* Feedback List */}
      <section className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <MessageSquareText className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            {sortedFeedback.length} feedback item{sortedFeedback.length !== 1 ? "s" : ""}
          </h2>
        </div>

        {notConfigured ? (
          <NotConfiguredState />
        ) : isLoading ? (
          <ListSkeleton />
        ) : error ? (
          <ErrorState message={error.message} onRetry={() => mutate()} />
        ) : sortedFeedback.length === 0 ? (
          <EmptyState
            title="No feedback found"
            description={feedback.length === 0 ? "No feedback has been submitted yet." : "Try adjusting your filters."}
          />
        ) : (
          <div className="flex flex-col gap-2">
            {sortedFeedback.map((f) => (
              <FeedbackCard
                key={f.feedback_id}
                feedback={f}
                raterName={f.rater_name}
                technicianName={f.technician_name}
                onMarkReviewed={handleMarkReviewed}
                onClick={() => setSelectedFeedback(f)}
              />
            ))}
          </div>
        )}
      </section>

      {/* Feedback Detail Dialog */}
      <Dialog open={!!selectedFeedback} onOpenChange={(open) => !open && setSelectedFeedback(null)}>
        <DialogContent className="max-w-lg rounded-lg">
          {selectedFeedback && (
            <>
              <DialogHeader>
                <DialogTitle className="text-lg font-semibold">Feedback Details</DialogTitle>
              </DialogHeader>

              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold">{selectedFeedback.rater_name || "Unknown"}</p>
                    <p className="text-xs text-muted-foreground">
                      Technician: {selectedFeedback.technician_name || "Unknown"}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    {getRatingStars(selectedFeedback.derived_rating)}
                  </div>
                </div>

                {selectedFeedback.feedback_text && (
                  <Card className="rounded-md border-border bg-muted/30 p-3">
                    <p className="text-sm">{selectedFeedback.feedback_text}</p>
                  </Card>
                )}

                <div className="grid grid-cols-2 gap-3 text-xs">
                  {selectedFeedback.derived_sentiment && (
                    <div>
                      <span className="font-medium text-muted-foreground">Sentiment:</span>
                      <span className={`ml-1 ${getSentimentColor(selectedFeedback.derived_sentiment)}`}>
                        {selectedFeedback.derived_sentiment}
                      </span>
                    </div>
                  )}
                  {selectedFeedback.derived_rating && (
                    <div>
                      <span className="font-medium text-muted-foreground">Rating:</span>
                      <span className="ml-1">{selectedFeedback.derived_rating}/5</span>
                    </div>
                  )}
                  {selectedFeedback.key_issues && (
                    <div className="col-span-2">
                      <span className="font-medium text-muted-foreground">Key Issues:</span>
                      <span className="ml-1">{selectedFeedback.key_issues}</span>
                    </div>
                  )}
                  {selectedFeedback.voice_duration_seconds && (
                    <div>
                      <span className="font-medium text-muted-foreground">Voice Duration:</span>
                      <span className="ml-1">{selectedFeedback.voice_duration_seconds}s</span>
                    </div>
                  )}
                  <div>
                    <span className="font-medium text-muted-foreground">Type:</span>
                    <span className="ml-1 capitalize">{selectedFeedback.feedback_type}</span>
                  </div>
                  <div>
                    <span className="font-medium text-muted-foreground">Submitted:</span>
                    <span className="ml-1">{timeAgo(selectedFeedback.created_at)}</span>
                  </div>
                </div>

                {selectedFeedback.flagged_for_review && !selectedFeedback.reviewed_at && (
                  <Button
                    className="w-full rounded-md"
                    onClick={() => {
                      handleMarkReviewed(selectedFeedback.feedback_id)
                      setSelectedFeedback(null)
                    }}
                  >
                    Mark as Reviewed
                  </Button>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
