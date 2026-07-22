"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useTheme } from "next-themes"
import { useEffect, useState } from "react"
import {
  LayoutDashboard,
  Inbox,
  ListChecks,
  ClipboardList,
  Users,
  HardHat,
  Boxes,
  Send,
  MessageSquareText,
  MessagesSquare,
  BarChart3,
  CalendarClock,
  Smartphone,
  Code2,
  Database,
  BookOpen,
  Sun,
  Moon,
  Monitor,
  LogOut,
  Menu,
} from "lucide-react"
import { useAuth } from "@/components/auth/auth-provider"
import { useNotificationItems, type NotificationItem } from "@/lib/hooks/use-notification-count"
import { useT } from "@/lib/i18n/i18n-provider"
import { NitaApi } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { RoleBadge } from "@/components/shared/badges"
import { NotificationBell } from "@/components/portal/notification-bell"
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet"
import { cn } from "@/lib/utils"

interface PendingApproval {
  task_request_id: string
  description?: string | null
  asset_name?: string | null
}

async function fetchPendingApprovals(): Promise<NotificationItem[]> {
  const res = await NitaApi.pendingApprovals()
  if (!res.ok || !res.data) return []
  const raw = (Array.isArray(res.data) ? res.data : [res.data]) as PendingApproval[]
  return raw.map((task) => ({
    id: task.task_request_id,
    title: task.asset_name ?? task.description ?? task.task_request_id,
    subtitle: task.asset_name ? (task.description ?? undefined) : undefined,
    href: "/admin/approvals",
  }))
}

const NAV = [
  { href: "/admin", labelKey: "nav.admin.dashboard", icon: LayoutDashboard },
  { href: "/admin/approvals", labelKey: "nav.admin.approvalQueue", icon: Inbox },
  { href: "/admin/tasks", labelKey: "nav.admin.allTasks", icon: ListChecks },
  { href: "/admin/work-orders", labelKey: "nav.admin.workOrders", icon: ClipboardList },
  { href: "/admin/technicians", labelKey: "nav.admin.technicians", icon: HardHat },
  { href: "/admin/assets", labelKey: "nav.admin.assets", icon: Boxes },
  { href: "/admin/users", labelKey: "nav.admin.users", icon: Users },
  { href: "/admin/assign", labelKey: "nav.admin.directAssign", icon: Send },
  { href: "/admin/feedback", labelKey: "nav.admin.feedback", icon: MessageSquareText },
  { href: "/admin/conversations", labelKey: "nav.admin.conversations", icon: MessagesSquare },
  { href: "/admin/analytics", labelKey: "nav.admin.analytics", icon: BarChart3 },
  { href: "/admin/preventive", labelKey: "nav.admin.preventive", icon: CalendarClock },
  { href: "/admin/simulator", labelKey: "nav.admin.simulator", icon: Smartphone },
  { href: "/admin/api-sandbox", labelKey: "nav.admin.apiSandbox", icon: Code2 },
  { href: "/admin/data-model", labelKey: "nav.admin.dataModel", icon: Database },
  { href: "/admin/docs", labelKey: "nav.admin.docs", icon: BookOpen },
]

function useApprovalNotifications() {
  const t = useT()
  return useNotificationItems(
    "admin:notifications:approvals",
    fetchPendingApprovals,
    (n) => t("admin.notifications.approvalCount", { count: n }),
  )
}

function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  if (!mounted) return null

  const cycle = () => {
    if (theme === "light") setTheme("dark")
    else if (theme === "dark") setTheme("system")
    else setTheme("light")
  }

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={cycle}
      className="h-8 w-8 rounded-md border-sidebar-border bg-transparent text-sidebar-foreground hover:bg-sidebar-accent"
      title={`Theme: ${theme}`}
    >
      {theme === "light" ? (
        <Sun className="h-3.5 w-3.5" />
      ) : theme === "dark" ? (
        <Moon className="h-3.5 w-3.5" />
      ) : (
        <Monitor className="h-3.5 w-3.5" />
      )}
    </Button>
  )
}

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname()
  const t = useT()

  return (
    <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto p-2">
      {NAV.map((item) => {
        const active = pathname === item.href
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-2.5 px-3 py-2 text-sm font-medium rounded-md transition-colors",
              active
                ? "bg-sidebar-primary text-sidebar-primary-foreground"
                : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground",
            )}
          >
            <item.icon className="h-4 w-4 shrink-0" />
            <span className="flex-1">{t(item.labelKey)}</span>
          </Link>
        )
      })}
    </nav>
  )
}

function SidebarInner({ onNavigate }: { onNavigate?: () => void }) {
  const { user, logout } = useAuth()
  const t = useT()
  return (
    <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
      <div className="flex items-center gap-2 border-b border-sidebar-border px-4 py-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sidebar-primary text-xs font-bold text-sidebar-primary-foreground">
          N
        </div>
        <div>
          <span className="text-lg font-bold tracking-tight">Nita</span>
          <span className="ml-1.5 text-xs text-sidebar-foreground/50">{t("nav.admin.title")}</span>
        </div>
      </div>
      <NavLinks onNavigate={onNavigate} />
      <div className="border-t border-sidebar-border p-3">
        <div className="mb-2 flex items-center justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{user?.full_name}</p>
            <p className="truncate text-xs text-sidebar-foreground/60">{user?.phone_number}</p>
          </div>
          <RoleBadge role={user?.role} />
        </div>
        <div className="flex gap-2">
          <ThemeToggle />
          <Button
            variant="outline"
            size="sm"
            onClick={logout}
            className="flex-1 gap-1.5 rounded-md border-sidebar-border bg-transparent text-sidebar-foreground hover:bg-sidebar-accent"
          >
            <LogOut className="h-3.5 w-3.5" />
            {t("common.logOut")}
          </Button>
        </div>
      </div>
    </div>
  )
}

export function AdminShell({ children }: { children: React.ReactNode }) {
  const t = useT()
  const { items, count } = useApprovalNotifications()

  return (
    <div className="flex min-h-dvh bg-background">
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-dvh w-60 shrink-0 border-r border-sidebar-border lg:block">
        <SidebarInner />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Mobile top bar */}
        <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-border bg-card px-4 py-3 lg:hidden">
          <Sheet>
            <SheetTrigger
              render={<Button variant="outline" size="icon" className="rounded-md" aria-label="Open menu" />}
            >
              <Menu className="h-4 w-4" />
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-0">
              <SheetTitle className="sr-only">{t("nav.admin.title")}</SheetTitle>
              <SidebarInner />
            </SheetContent>
          </Sheet>
          <span className="text-lg font-bold tracking-tight text-foreground">Nita</span>
          <span className="flex-1 text-xs text-muted-foreground">{t("nav.admin.title")}</span>
          <NotificationBell items={items} count={count} />
        </header>

        {/* Desktop top bar */}
        <header className="sticky top-0 z-30 hidden items-center justify-end border-b border-border bg-card px-6 py-2.5 lg:flex">
          <NotificationBell items={items} count={count} />
        </header>

        <main className="min-w-0 flex-1 p-4 md:p-6">{children}</main>
      </div>
    </div>
  )
}
