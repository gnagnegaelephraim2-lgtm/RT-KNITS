"use client"

import { useState } from "react"
import { Loader2, Send } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/components/auth/auth-provider"
import { NitaApi } from "@/lib/api"

/**
 * Media is never stored in Supabase — it lives only in WhatsApp. This button
 * asks the backend to forward the original media to a WhatsApp number, defaulting
 * to the logged-in user's own number.
 */
export function ForwardMediaButton({
  taskId,
  label = "Send to my WhatsApp",
  size = "sm",
  className,
}: {
  taskId: string
  label?: string
  size?: "sm" | "xs" | "default"
  className?: string
}) {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)

  async function forward() {
    if (!user?.phone_number) {
      toast.error("No phone number on your profile to forward to.")
      return
    }
    setLoading(true)
    const res = await NitaApi.forwardMedia({ task_id: taskId, recipient_phone: user.phone_number })
    setLoading(false)
    if (res.ok && !(res.data as { error?: boolean })?.error) {
      toast.success(`Media sent to ${user.phone_number} on WhatsApp.`)
    } else {
      const msg = (res.data as { message?: string })?.message ?? res.error ?? "Could not forward media."
      toast.error(msg)
    }
  }

  return (
    <Button
      type="button"
      variant="outline"
      size={size}
      onClick={forward}
      disabled={loading}
      className={className ?? "gap-1.5 rounded-md"}
    >
      {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
      {label}
    </Button>
  )
}
