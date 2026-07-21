"use client"

import type { ReactNode } from "react"
import { AlertTriangle, Inbox, RefreshCw, Database } from "lucide-react"
import { useT } from "@/lib/i18n/i18n-provider"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"

export function ListSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="flex flex-col gap-2" aria-busy="true" aria-label="Loading">
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-3 border border-border bg-card p-3"
          style={{ animationDelay: `${i * 60}ms` }}
        >
          <Skeleton className="h-10 w-10 rounded-lg" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3.5 w-1/3" />
            <Skeleton className="h-3 w-2/3" />
          </div>
          <Skeleton className="h-6 w-20 rounded-md" />
        </div>
      ))}
    </div>
  )
}

export function CardsSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} className="h-24 w-full rounded-lg" />
      ))}
    </div>
  )
}

export function EmptyState({
  title,
  description,
  icon,
  action,
}: {
  title?: string
  description?: string
  icon?: ReactNode
  action?: ReactNode
}) {
  const t = useT()
  return (
    <div className="animate-fade-in flex flex-col items-center justify-center gap-3 border border-dashed border-border bg-card px-6 py-14 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted text-muted-foreground">
        {icon ?? <Inbox className="h-7 w-7" />}
      </div>
      <p className="text-sm font-semibold text-foreground">{title ?? t("states.emptyTitle")}</p>
      {description && (
        <p className="max-w-sm text-sm text-muted-foreground text-pretty">{description}</p>
      )}
      {action && <div className="mt-1">{action}</div>}
    </div>
  )
}

export function ErrorState({ message, onRetry }: { message?: string; onRetry?: () => void }) {
  const t = useT()
  return (
    <div className="animate-fade-in flex flex-col items-center justify-center gap-3 border border-destructive/30 bg-destructive/5 px-6 py-10 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
        <AlertTriangle className="h-6 w-6 text-destructive" />
      </div>
      <div>
        <p className="text-sm font-semibold text-foreground">{t("states.errorTitle")}</p>
        <p className="mt-1 max-w-md text-sm text-muted-foreground text-pretty">
          {message ?? t("states.errorDefault")}
        </p>
      </div>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry} className="gap-2 rounded-lg">
          <RefreshCw className="h-3.5 w-3.5" />
          {t("common.retry")}
        </Button>
      )}
    </div>
  )
}

export function NotConfiguredState() {
  const t = useT()
  return (
    <div className="animate-fade-in flex flex-col items-center justify-center gap-3 border border-amber-500/30 bg-amber-500/5 px-6 py-10 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-500/10">
        <Database className="h-6 w-6 text-amber-600" />
      </div>
      <div>
        <p className="text-sm font-semibold text-foreground">{t("states.notConfiguredTitle")}</p>
        <p className="mt-1 max-w-md text-sm text-muted-foreground text-pretty">
          {t("states.notConfiguredDescription")}
        </p>
      </div>
    </div>
  )
}
