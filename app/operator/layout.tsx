"use client"

import { Home, FilePlus2, MessageSquareText, User } from "lucide-react"
import { PortalGuard } from "@/components/portal/portal-guard"
import { TopNav, type NavItem } from "@/components/portal/top-nav"
import { NotificationBell } from "@/components/portal/notification-bell"
import { useAuth } from "@/components/auth/auth-provider"
import { useLookups } from "@/lib/hooks/use-lookups"
import { useNotificationItems, type NotificationItem } from "@/lib/hooks/use-notification-count"
import { useT } from "@/lib/i18n/i18n-provider"
import { getSupabaseBrowser } from "@/lib/supabase/client"
import type { Asset } from "@/lib/types"

interface OperatorNotificationRow {
  task_request_id: string
  asset_id: string | null
  status: string
  description: string | null
}

async function fetchReportUpdates(
  userId: string,
  assetMap: Map<string, Asset>,
  t: (key: string) => string,
): Promise<NotificationItem[]> {
  const sb = getSupabaseBrowser()
  if (!sb) return []
  const { data, error } = await sb
    .from("task_request")
    .select("task_request_id, asset_id, status, description")
    .eq("created_by_user_id", userId)
    .in("status", ["approved", "rejected"])
    .order("requested_at", { ascending: false })
    .limit(5)
  if (error || !data) return []
  return (data as OperatorNotificationRow[]).map((row) => {
    const asset = row.asset_id ? assetMap.get(row.asset_id) : undefined
    const statusLabel = row.status === "approved" ? t("badges.status.approved") : t("badges.status.rejected")
    return {
      id: row.task_request_id,
      title: `${asset?.name ?? t("operator.home.unknownAsset")} — ${statusLabel}`,
      subtitle: row.description ?? undefined,
      href: "/operator",
    }
  })
}

function OperatorNav() {
  const { user } = useAuth()
  const { assetMap } = useLookups()
  const t = useT()

  const { items: notificationItems, count } = useNotificationItems(
    user ? `operator:notifications:reports:${user.user_id}` : null,
    () => fetchReportUpdates(user!.user_id, assetMap, t),
    (n) => t("operator.notifications.reportCount", { count: n }),
  )

  const items: NavItem[] = [
    { href: "/operator", label: t("nav.operator.home"), icon: Home },
    { href: "/operator/report", label: t("nav.operator.newReport"), icon: FilePlus2 },
    { href: "/operator/feedback", label: t("nav.operator.myFeedback"), icon: MessageSquareText },
    { href: "/operator/profile", label: t("nav.operator.profile"), icon: User },
  ]

  return (
    <TopNav
      items={items}
      title={t("nav.operator.title")}
      notifications={<NotificationBell items={notificationItems} count={count} />}
    />
  )
}

export default function OperatorLayout({ children }: { children: React.ReactNode }) {
  return (
    <PortalGuard role="operator">
      <div className="min-h-dvh bg-background">
        <OperatorNav />
        <div className="mx-auto max-w-5xl px-4 py-6">{children}</div>
      </div>
    </PortalGuard>
  )
}
