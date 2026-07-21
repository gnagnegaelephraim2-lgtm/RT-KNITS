"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Search, Send, CheckCircle2, MessageCircle, AlertCircle } from "lucide-react"
import { toast } from "sonner"
import { useAuth } from "@/components/auth/auth-provider"
import { useLookups } from "@/lib/hooks/use-lookups"
import { useT } from "@/lib/i18n/i18n-provider"
import { NitaApi } from "@/lib/api"
import { NITA_WHATSAPP, PRIORITY_META } from "@/lib/constants"
import { AssetStatusBadge } from "@/components/shared/badges"
import { NotConfiguredState } from "@/components/shared/states"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import type { Asset, Priority } from "@/lib/types"

export default function OperatorReport() {
  const { user } = useAuth()
  const router = useRouter()
  const t = useT()
  const { assets, notConfigured, isLoading } = useLookups()

  const [query, setQuery] = useState("")
  const [selected, setSelected] = useState<Asset | null>(null)
  const [description, setDescription] = useState("")
  const [priority, setPriority] = useState<Priority>(1)
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)

  const matches =
    query.trim().length > 0
      ? assets
          .filter((a) => {
            const q = query.toLowerCase()
            return (
              a.name.toLowerCase().includes(q) ||
              a.asset_code.toLowerCase().includes(q) ||
              (a.location ?? "").toLowerCase().includes(q)
            )
          })
          .slice(0, 6)
      : []

  async function submit() {
    if (!selected || !description.trim() || !user) return
    setSubmitting(true)
    const res = await NitaApi.taskLifecycle({
      action: "create",
      asset_id: selected.asset_id,
      asset_code: selected.asset_code,
      description: description.trim(),
      priority,
      created_by_user_id: user.user_id,
      created_by_role: "operator",
      reporter_phone: user.phone_number,
      task_type: "repair",
    })
    setSubmitting(false)
    if (res.ok) {
      setDone(true)
      toast.success(t("operator.report.submitSuccess"), { description: t("operator.report.submitSuccessDescription") })
    } else {
      toast.error(t("operator.report.submitFailed"), {
        description: res.error ?? t("operator.report.submitFailedDefault", { status: res.status }),
      })
    }
  }

  if (notConfigured) {
    return (
      <div className="flex flex-col gap-6">
        <h1 className="text-2xl font-bold tracking-tight">{t("operator.report.title")}</h1>
        <NotConfiguredState />
      </div>
    )
  }

  if (done) {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center gap-4 py-10 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-[#16A34A]/10 text-[#16A34A]">
          <CheckCircle2 className="h-9 w-9" />
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tight">{t("operator.report.doneTitle")}</h1>
          <p className="mt-1 text-sm text-muted-foreground text-pretty">
            {t("operator.report.doneDescription", { asset: selected?.name ?? "" })}
          </p>
        </div>
        <div className="flex w-full flex-col gap-2">
          <Button className="rounded-md" onClick={() => router.push("/operator")}>
            {t("operator.report.backToReports")}
          </Button>
          <Button
            variant="outline"
            className="gap-2 rounded-md"
            render={<a href={`https://wa.me/${NITA_WHATSAPP}`} target="_blank" rel="noopener noreferrer" />}
            nativeButton={false}
          >
            <MessageCircle className="h-4 w-4" />
            {t("operator.report.addPhotosWhatsApp")}
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t("operator.report.title")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("operator.report.subtitle")}</p>
      </div>

      {/* Step 1: asset */}
      <Card className="flex flex-col gap-3 rounded-lg p-4">
        <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {t("operator.report.step1")}
        </Label>
        {selected ? (
          <div className="flex items-center justify-between gap-3 border border-border bg-muted/40 p-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="truncate font-semibold">{selected.name}</span>
                <span className="font-mono text-xs text-muted-foreground">{selected.asset_code}</span>
              </div>
              <p className="mt-0.5 truncate text-sm text-muted-foreground">
                {selected.location ?? t("operator.report.noLocation")}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <AssetStatusBadge status={selected.status} />
              <Button variant="ghost" size="sm" className="rounded-md" onClick={() => setSelected(null)}>
                {t("operator.report.change")}
              </Button>
            </div>
          </div>
        ) : (
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="rounded-md pl-9"
              placeholder={isLoading ? t("operator.report.loadingMachines") : t("operator.report.searchPlaceholder")}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              disabled={isLoading}
            />
            {matches.length > 0 && (
              <div className="mt-2 flex flex-col gap-1 border border-border bg-card p-1">
                {matches.map((a) => (
                  <button
                    key={a.asset_id}
                    onClick={() => {
                      setSelected(a)
                      setQuery("")
                    }}
                    className="flex items-center justify-between gap-2 px-2 py-2 text-left text-sm hover:bg-muted"
                  >
                    <span className="min-w-0">
                      <span className="font-medium">{a.name}</span>{" "}
                      <span className="font-mono text-xs text-muted-foreground">{a.asset_code}</span>
                    </span>
                    <AssetStatusBadge status={a.status} />
                  </button>
                ))}
              </div>
            )}
            {query.trim().length > 0 && matches.length === 0 && !isLoading && (
              <p className="mt-2 flex items-center gap-1.5 text-sm text-muted-foreground">
                <AlertCircle className="h-3.5 w-3.5" />
                {t("operator.report.noMatches", { query })}
              </p>
            )}
          </div>
        )}
      </Card>

      {/* Step 2: description */}
      <Card className="flex flex-col gap-3 rounded-lg p-4">
        <Label htmlFor="desc" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {t("operator.report.step2")}
        </Label>
        <Textarea
          id="desc"
          className="min-h-24 rounded-md"
          placeholder={t("operator.report.descriptionPlaceholder")}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </Card>

      {/* Step 3: priority */}
      <Card className="flex flex-col gap-3 rounded-lg p-4">
        <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {t("operator.report.step3")}
        </Label>
        <div className="grid grid-cols-3 gap-2">
          {([0, 1, 2] as Priority[]).map((p) => {
            const m = PRIORITY_META[p]
            const activeP = priority === p
            return (
              <button
                key={p}
                onClick={() => setPriority(p)}
                className={cn(
                  "flex flex-col items-center gap-1 border p-3 text-center transition-all rounded-md",
                  activeP ? "border-2" : "border-border opacity-70 hover:opacity-100",
                )}
                style={activeP ? { borderColor: m.color } : undefined}
              >
                <span
                  className="flex h-7 w-7 items-center justify-center rounded-md text-xs font-bold"
                  style={{ backgroundColor: m.color, color: m.fg }}
                >
                  {m.short}
                </span>
                <span className="text-sm font-semibold">{t(m.labelKey)}</span>
              </button>
            )
          })}
        </div>
      </Card>

      <Button
        size="lg"
        className="gap-2 rounded-md"
        disabled={!selected || !description.trim() || submitting}
        onClick={submit}
      >
        <Send className="h-4 w-4" />
        {submitting ? t("operator.report.submitting") : t("operator.report.submit")}
      </Button>
    </div>
  )
}
