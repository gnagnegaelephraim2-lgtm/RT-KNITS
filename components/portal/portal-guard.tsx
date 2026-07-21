"use client"

import { Loader2 } from "lucide-react"
import { useRequireRole } from "@/components/auth/auth-provider"
import type { Role } from "@/lib/types"

export function PortalGuard({ role, children }: { role: Role; children: React.ReactNode }) {
  const { user, loading } = useRequireRole(role)

  if (loading || !user || user.role !== role) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-background">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading your portal…
        </div>
      </div>
    )
  }

  return <>{children}</>
}
