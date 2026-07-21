"use client"

import { PortalGuard } from "@/components/portal/portal-guard"
import { AdminShell } from "@/components/portal/admin-shell"

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <PortalGuard role="admin">
      <AdminShell>{children}</AdminShell>
    </PortalGuard>
  )
}
