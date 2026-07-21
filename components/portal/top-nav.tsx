"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"
import { LogOut, Menu, X } from "lucide-react"
import { useAuth } from "@/components/auth/auth-provider"
import { useT } from "@/lib/i18n/i18n-provider"
import { Button } from "@/components/ui/button"
import { RoleBadge } from "@/components/shared/badges"
import { cn } from "@/lib/utils"

export interface NavItem {
  href: string
  label: string
  icon: React.ComponentType<{ className?: string }>
}

export function TopNav({
  items,
  title,
  notifications,
}: {
  items: NavItem[]
  title: string
  notifications?: React.ReactNode
}) {
  const pathname = usePathname()
  const { user, logout } = useAuth()
  const t = useT()
  const [open, setOpen] = useState(false)

  const isActive = (href: string) => pathname === href

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-card">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold tracking-tight text-foreground">Nita</span>
          <span className="hidden text-sm text-muted-foreground sm:inline">/ {title}</span>
        </div>

        <nav className="hidden items-center gap-1 md:flex">
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md transition-colors",
                isActive(item.href)
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <div className="hidden items-center gap-2 sm:flex">
            <div className="text-right">
              <p className="text-sm font-medium leading-none text-foreground">{user?.full_name}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">{user?.phone_number}</p>
            </div>
            <RoleBadge role={user?.role} />
          </div>
          {notifications}
          <Button variant="outline" size="sm" onClick={logout} className="gap-1.5 rounded-md">
            <LogOut className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{t("common.logOut")}</span>
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="rounded-md md:hidden"
            onClick={() => setOpen((v) => !v)}
            aria-label="Toggle menu"
          >
            {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {open && (
        <nav className="border-t border-border bg-card px-4 py-2 md:hidden">
          <div className="mx-auto flex max-w-5xl flex-col gap-1">
            {items.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md",
                  isActive(item.href)
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            ))}
          </div>
        </nav>
      )}
    </header>
  )
}
