"use client"

import Link from "next/link"
import { Bell } from "lucide-react"
import { useT } from "@/lib/i18n/i18n-provider"
import type { NotificationItem } from "@/lib/hooks/use-notification-count"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuLinkItem,
} from "@/components/ui/dropdown-menu"

function BellCount({ count }: { count: number }) {
  if (!count) return null
  return (
    <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#DC2626] px-1 text-[10px] font-bold text-white">
      {count > 99 ? "99+" : count}
    </span>
  )
}

export function NotificationBell({ items, count }: { items: NotificationItem[]; count: number }) {
  const t = useT()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="outline" size="icon" className="relative rounded-md" aria-label={t("notifications.title")} />
        }
      >
        <Bell className="h-4 w-4" />
        <BellCount count={count} />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuGroup>
          <DropdownMenuLabel>{t("notifications.title")}</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {items.length === 0 ? (
            <p className="px-2 py-4 text-center text-sm text-muted-foreground">{t("notifications.empty")}</p>
          ) : (
            items.slice(0, 8).map((item) => (
              <DropdownMenuLinkItem
                key={item.id}
                render={<Link href={item.href} />}
                closeOnClick
                className="flex-col items-start gap-0.5 py-2 cursor-pointer"
              >
                <span className="text-sm font-medium leading-snug">{item.title}</span>
                {item.subtitle && <span className="text-xs text-muted-foreground">{item.subtitle}</span>}
              </DropdownMenuLinkItem>
            ))
          )}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
