import type { Priority } from "@/lib/types"

// Priority color coding (exact, mandated). Priority is ZERO-INDEXED (0/1/2).
// labelKey resolves through lib/i18n/dictionaries.ts via useT().
export const PRIORITY_META: Record<Priority, { labelKey: string; short: string; color: string; fg: string }> = {
  0: { labelKey: "badges.priority.0", short: "P0", color: "#DC2626", fg: "#ffffff" },
  1: { labelKey: "badges.priority.1", short: "P1", color: "#EA580C", fg: "#ffffff" },
  2: { labelKey: "badges.priority.2", short: "P2", color: "#16A34A", fg: "#ffffff" },
}

// Status color coding (exact, mandated). Keyed by every status string used across tables.
export const STATUS_META: Record<string, { labelKey: string; color: string; fg: string }> = {
  pending_approval: { labelKey: "badges.status.pending_approval", color: "#D97706", fg: "#ffffff" },
  pending: { labelKey: "badges.status.pending", color: "#D97706", fg: "#ffffff" },
  approved: { labelKey: "badges.status.approved", color: "#2563EB", fg: "#ffffff" },
  assigned: { labelKey: "badges.status.assigned", color: "#2563EB", fg: "#ffffff" },
  accepted: { labelKey: "badges.status.accepted", color: "#2563EB", fg: "#ffffff" },
  in_progress: { labelKey: "badges.status.in_progress", color: "#EA580C", fg: "#ffffff" },
  completed: { labelKey: "badges.status.completed", color: "#16A34A", fg: "#ffffff" },
  rejected: { labelKey: "badges.status.rejected", color: "#6B7280", fg: "#ffffff" },
  declined: { labelKey: "badges.status.declined", color: "#6B7280", fg: "#ffffff" },
  cancelled: { labelKey: "badges.status.cancelled", color: "#6B7280", fg: "#ffffff" },
  paused: { labelKey: "badges.status.paused", color: "#6B7280", fg: "#ffffff" },
  acknowledged: { labelKey: "badges.status.acknowledged", color: "#7C3AED", fg: "#ffffff" },
}

export const ASSET_STATUS_META: Record<string, { labelKey: string; color: string; fg: string }> = {
  in_use: { labelKey: "badges.assetStatus.in_use", color: "#16A34A", fg: "#ffffff" },
  down: { labelKey: "badges.assetStatus.down", color: "#DC2626", fg: "#ffffff" },
  maintenance: { labelKey: "badges.assetStatus.maintenance", color: "#D97706", fg: "#ffffff" },
  retired: { labelKey: "badges.assetStatus.retired", color: "#6B7280", fg: "#ffffff" },
}

export const TRADES = ["mechanic", "electrician", "welder", "plumber", "hvac", "general"] as const

export const TASK_TYPES = ["repair", "preventive", "emergency", "inspection"] as const

export const ROLES = ["operator", "technician", "admin"] as const

// Nita's WhatsApp number placeholder. Replace with the real number.
export const NITA_WHATSAPP = "23050000000"

export function priorityMeta(p: number | null | undefined) {
  const key = (p ?? 2) as Priority
  return PRIORITY_META[key] ?? PRIORITY_META[2]
}

export function statusMeta(s: string | null | undefined) {
  if (!s) return { labelKey: "badges.status.unknown", color: "#6B7280", fg: "#ffffff" }
  return STATUS_META[s] ?? { labelKey: "badges.status.unknown", color: "#6B7280", fg: "#ffffff" }
}
