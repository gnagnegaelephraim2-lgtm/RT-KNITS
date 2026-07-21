"use client"

import { useState } from "react"
import { toast } from "sonner"
import { LogOut, Phone, Building2, Globe, ShieldCheck } from "lucide-react"
import { useAuth } from "@/components/auth/auth-provider"
import { useLookups } from "@/lib/hooks/use-lookups"
import { getSupabaseBrowser } from "@/lib/supabase/client"
import { useT } from "@/lib/i18n/i18n-provider"
import { LOCALES } from "@/lib/i18n/dictionaries"
import { RoleBadge } from "@/components/shared/badges"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

function Row({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 border-b border-border py-3 last:border-b-0">
      <span className="flex h-8 w-8 items-center justify-center rounded-md bg-muted text-muted-foreground">
        {icon}
      </span>
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
        <p className="truncate text-sm font-medium text-foreground">{value}</p>
      </div>
    </div>
  )
}

export function ProfileView() {
  const { user, logout, updateUser } = useAuth()
  const { deptMap } = useLookups()
  const t = useT()
  const [savingLanguage, setSavingLanguage] = useState(false)

  async function changeLanguage(lang: string) {
    if (!user || lang === user.preferred_language) return
    const previous = user.preferred_language
    setSavingLanguage(true)
    updateUser({ preferred_language: lang })
    const sb = getSupabaseBrowser()
    if (!sb) {
      setSavingLanguage(false)
      toast.error(t("profile.databaseNotConfigured"))
      updateUser({ preferred_language: previous })
      return
    }
    const { error } = await sb.from("app_user").update({ preferred_language: lang }).eq("user_id", user.user_id)
    setSavingLanguage(false)
    if (error) {
      updateUser({ preferred_language: previous })
      toast.error(t("profile.languageUpdateFailed"))
    } else {
      toast.success(t("profile.languageUpdated"))
    }
  }

  if (!user) return null

  const dept = user.department_id ? deptMap.get(user.department_id)?.name : null
  const initials = user.full_name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase()

  return (
    <div className="mx-auto flex max-w-md flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t("profile.title")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("profile.subtitle")}</p>
      </div>

      <Card className="flex flex-col items-center gap-3 rounded-lg p-6">
        <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-primary text-xl font-bold text-primary-foreground">
          {initials}
        </div>
        <div className="text-center">
          <p className="text-lg font-bold">{user.full_name}</p>
          <div className="mt-1 flex justify-center">
            <RoleBadge role={user.role} />
          </div>
        </div>
      </Card>

      <Card className="rounded-lg px-4 py-1">
        <Row icon={<Phone className="h-4 w-4" />} label={t("profile.phone")} value={user.phone_number} />
        <Row icon={<Building2 className="h-4 w-4" />} label={t("profile.department")} value={dept ?? t("profile.unassigned")} />
        <div className="flex items-center gap-3 border-b border-border py-3 last:border-b-0">
          <span className="flex h-8 w-8 items-center justify-center rounded-md bg-muted text-muted-foreground">
            <Globe className="h-4 w-4" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t("profile.language")}</p>
            <Select
              value={user.preferred_language ?? "en"}
              onValueChange={(value) => value && changeLanguage(value)}
              disabled={savingLanguage}
            >
              <SelectTrigger className="mt-1 h-8 w-full rounded-md">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(LOCALES).map(([code, label]) => (
                  <SelectItem key={code} value={code}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <Row icon={<ShieldCheck className="h-4 w-4" />} label={t("profile.role")} value={<span className="capitalize">{user.role}</span>} />
      </Card>

      <Button variant="outline" className="gap-2 rounded-md" onClick={logout}>
        <LogOut className="h-4 w-4" />
        {t("common.logOut")}
      </Button>
    </div>
  )
}
