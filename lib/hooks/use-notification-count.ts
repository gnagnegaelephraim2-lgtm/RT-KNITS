"use client"

import { useEffect, useRef } from "react"
import useSWR from "swr"
import { toast } from "sonner"

export interface NotificationItem {
  id: string
  title: string
  subtitle?: string
  href: string
}

/**
 * Polls a list of notification items via the external webhook/Supabase API and
 * toasts when the count rises. Used for the bell dropdown in the portal nav.
 */
export function useNotificationItems(
  key: string | null,
  fetcher: () => Promise<NotificationItem[]>,
  toastMessage: (count: number) => string,
) {
  const { data, isLoading } = useSWR<NotificationItem[]>(key, fetcher, {
    refreshInterval: 20000,
    revalidateOnFocus: true,
  })
  const items = data ?? []
  const count = items.length
  const seen = useRef<number | null>(null)
  const messageRef = useRef(toastMessage)
  messageRef.current = toastMessage

  useEffect(() => {
    if (seen.current !== null && count > seen.current) {
      toast.info(messageRef.current(count))
    }
    seen.current = count
  }, [count])

  return { items, count, isLoading }
}
