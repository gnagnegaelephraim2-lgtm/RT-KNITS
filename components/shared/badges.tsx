"use client"

import { priorityMeta, statusMeta, ASSET_STATUS_META } from "@/lib/constants"
import { useT } from "@/lib/i18n/i18n-provider"
import { cn } from "@/lib/utils"

const base =
  "inline-flex items-center gap-1.5 px-2 py-0.5 text-xs font-semibold uppercase tracking-wide rounded-md leading-tight shadow-sm"

export function PriorityBadge({ priority, className }: { priority: number | null | undefined; className?: string }) {
  const t = useT()
  const m = priorityMeta(priority)
  return (
    <span className={cn(base, className)} style={{ backgroundColor: m.color, color: m.fg }}>
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-60" />
      {t(m.labelKey)}
    </span>
  )
}

export function StatusBadge({ status, className }: { status: string | null | undefined; className?: string }) {
  const t = useT()
  const m = statusMeta(status)
  return (
    <span className={cn(base, className)} style={{ backgroundColor: m.color, color: m.fg }}>
      {t(m.labelKey)}
    </span>
  )
}

export function AssetStatusBadge({ status, className }: { status: string | null | undefined; className?: string }) {
  const t = useT()
  const meta = status ? ASSET_STATUS_META[status] : undefined
  const labelKey = meta?.labelKey ?? "badges.status.unknown"
  const color = meta?.color ?? "#6B7280"
  return (
    <span className={cn(base, className)} style={{ backgroundColor: color, color: "#ffffff" }}>
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-60" />
      {t(labelKey)}
    </span>
  )
}

export function RoleBadge({ role, className }: { role: string | null | undefined; className?: string }) {
  const colors: Record<string, string> = {
    operator: "#2563EB",
    technician: "#7C3AED",
    admin: "#0F172A",
  }
  const color = (role && colors[role]) || "#6B7280"
  return (
    <span className={cn(base, className)} style={{ backgroundColor: color, color: "#ffffff" }}>
      {role ?? "Unknown"}
    </span>
  )
}
