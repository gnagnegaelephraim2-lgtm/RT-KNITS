"use client"

import { Home, History, Search, User } from "lucide-react"
import { PortalGuard } from "@/components/portal/portal-guard"
import { TopNav, type NavItem } from "@/components/portal/top-nav"
import { NotificationBell } from "@/components/portal/notification-bell"
import { useAuth } from "@/components/auth/auth-provider"
import { useLookups } from "@/lib/hooks/use-lookups"
import { useNotificationItems, type NotificationItem } from "@/lib/hooks/use-notification-count"
import { useT } from "@/lib/i18n/i18n-provider"
import { NitaApi } from "@/lib/api"

interface DailyTask {
  work_order_id: string
  status?: string
  asset_name?: string | null
  description?: string | null
}

async function fetchActionableTasks(technicianId: string): Promise<NotificationItem[]> {
  const res = await NitaApi.technicianDailyTasks(technicianId)
  if (!res.ok || !res.data) return []
  const payload = res.data as { tasks?: DailyTask[] }
  const tasks = payload.tasks ?? []
  return tasks
    .filter((t) => t.status === "assigned" || t.status === "acknowledged")
    .map((t) => ({
      id: t.work_order_id,
      title: t.asset_name ?? t.description ?? t.work_order_id,
      subtitle: t.asset_name ? (t.description ?? undefined) : undefined,
      href: "/technician",
    }))
}

function TechnicianNav() {
  const { user } = useAuth()
  const { technicians } = useLookups()
  const t = useT()
  const technicianId = user ? technicians.find((tech) => tech.user_id === user.user_id)?.technician_id : undefined
  const { items: notificationItems, count: taskCount } = useNotificationItems(
    technicianId ? `technician:notifications:tasks:${technicianId}` : null,
    () => fetchActionableTasks(technicianId!),
    (n) => t("technician.notifications.taskCount", { count: n }),
  )

  const items: NavItem[] = [
    { href: "/technician", label: t("nav.technician.home"), icon: Home },
    { href: "/technician/history", label: t("nav.technician.history"), icon: History },
    { href: "/technician/assets", label: t("nav.technician.assetLookup"), icon: Search },
    { href: "/technician/profile", label: t("nav.technician.profile"), icon: User },
  ]

  return (
    <TopNav
      items={items}
      title={t("nav.technician.title")}
      notifications={<NotificationBell items={notificationItems} count={taskCount} />}
    />
  )
}

export default function TechnicianLayout({ children }: { children: React.ReactNode }) {
  return (
    <PortalGuard role="technician">
      <div className="min-h-dvh bg-background">
        <TechnicianNav />
        <div className="mx-auto max-w-5xl px-4 py-6">{children}</div>
      </div>
    </PortalGuard>
  )
}
