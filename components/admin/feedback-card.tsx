import { WorkOrderFeedback } from "@/lib/types"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AlertTriangle, Star } from "lucide-react"

interface FeedbackCardProps {
  feedback: WorkOrderFeedback
  raterName?: string
  technicianName?: string
  onMarkReviewed?: (feedbackId: string) => void
  onClick?: () => void
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

export function FeedbackCard({ feedback, raterName, technicianName, onMarkReviewed, onClick }: FeedbackCardProps) {
  return (
    <Card
      className={`rounded-lg border-border bg-card p-4 cursor-pointer transition-colors hover:border-primary ${feedback.flagged_for_review ? "border-red-500" : ""}`}
      onClick={onClick}
    >
      <div className="flex flex-col gap-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold">{raterName || "Unknown"}</span>
              {feedback.flagged_for_review && <AlertTriangle className="h-3 w-3 shrink-0 text-red-500" />}
            </div>
            <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
              <span>Technician: {technicianName || "Unknown"}</span>
              <span>·</span>
              <span>{timeAgo(feedback.created_at)}</span>
              <span>·</span>
              <span className="capitalize">{feedback.feedback_type}</span>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-1">{getRatingStars(feedback.derived_rating)}</div>
        </div>

        {feedback.feedback_text && (
          <p className="text-sm text-muted-foreground line-clamp-2">{feedback.feedback_text}</p>
        )}

        <div className="flex flex-wrap items-center gap-3 text-xs">
          {feedback.derived_sentiment && (
            <span className={`font-medium ${getSentimentColor(feedback.derived_sentiment)}`}>
              Sentiment: {feedback.derived_sentiment}
            </span>
          )}
          {feedback.key_issues && <span className="text-muted-foreground">Issues: {feedback.key_issues}</span>}
          {feedback.voice_duration_seconds && (
            <span className="text-muted-foreground">Voice: {feedback.voice_duration_seconds}s</span>
          )}
        </div>

        <div className="flex items-center justify-between">
          {feedback.reviewed_at ? (
            <span className="text-xs text-muted-foreground">Reviewed {timeAgo(feedback.reviewed_at)}</span>
          ) : (
            <span className="text-xs text-muted-foreground">Not reviewed</span>
          )}

          {!feedback.reviewed_at && feedback.flagged_for_review && onMarkReviewed && (
            <Button
              size="sm"
              variant="outline"
              className="rounded-md"
              onClick={(e) => {
                e.stopPropagation()
                onMarkReviewed(feedback.feedback_id)
              }}
            >
              Mark Reviewed
            </Button>
          )}
        </div>
      </div>
    </Card>
  )
}
