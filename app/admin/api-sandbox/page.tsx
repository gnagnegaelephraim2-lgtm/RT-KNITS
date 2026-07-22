"use client"

import { useState, useCallback } from "react"
import { Play, Copy, Check } from "lucide-react"
import { useT } from "@/lib/i18n/i18n-provider"
import { API_BASE } from "@/lib/api"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface EndpointDef {
  value: string
  label: string
  method: "GET" | "POST"
  description: string
  params?: { key: string; label: string; placeholder: string }[]
}

const ENDPOINTS: EndpointDef[] = [
  { value: "api-pending-approvals", label: "GET /api-pending-approvals", method: "GET", description: "Fetch all pending task approvals awaiting coordinator review." },
  { value: "api-assets", label: "GET /api-assets", method: "GET", description: "Look up a specific asset by code.", params: [{ key: "code", label: "Asset Code", placeholder: "39" }] },
  { value: "api-find-asset", label: "GET /api-find-asset", method: "GET", description: "Search assets by location and keyword.", params: [
    { key: "location", label: "Location", placeholder: "Knitting" },
    { key: "keyword", label: "Keyword", placeholder: "Circular" },
  ]},
  { value: "api-technicians", label: "GET /api-technicians", method: "GET", description: "List technicians, optionally filtered by trade.", params: [{ key: "trade", label: "Trade", placeholder: "mechanic" }] },
  { value: "api-recommend-technician", label: "GET /api-recommend-technician", method: "GET", description: "AI-recommended technician for a given trade.", params: [{ key: "trade", label: "Trade", placeholder: "electrician" }] },
  { value: "api-technician-daily-tasks", label: "GET /api-technician-daily-tasks", method: "GET", description: "Get daily task queue for a technician.", params: [{ key: "technician_id", label: "Technician ID", placeholder: "tech-1" }] },
  { value: "api-next-task", label: "GET /api-next-task", method: "GET", description: "Get the next recommended task for a technician.", params: [{ key: "technician_id", label: "Technician ID", placeholder: "tech-1" }] },
  { value: "api-admin-status", label: "GET /api-admin-status", method: "GET", description: "Dashboard KPIs and system health." },
  { value: "api-admin-read", label: "GET /api-admin-read", method: "GET", description: "Read any table with optional filters.", params: [
    { key: "table", label: "Table", placeholder: "department" },
    { key: "filter_field", label: "Filter Field", placeholder: "status" },
    { key: "filter_value", label: "Filter Value", placeholder: "active" },
    { key: "limit", label: "Limit", placeholder: "50" },
  ]},
  { value: "api-task-lifecycle", label: "POST /api-task-lifecycle", method: "POST", description: "Create, approve, or reject task requests." },
  { value: "api-technician-actions", label: "POST /api-technician-actions", method: "POST", description: "Technician start/done/decline/acknowledge actions." },
  { value: "api-admin-assign", label: "POST /api-admin-assign", method: "POST", description: "Directly assign a work order to a technician." },
  { value: "api-feedback", label: "POST /api-feedback", method: "POST", description: "Submit technician feedback/rating." },
  { value: "api-forward-media", label: "POST /api-forward-media", method: "POST", description: "Forward WhatsApp media to a recipient." },
]

export default function ApiSandboxPage() {
  const t = useT()
  const [selected, setSelected] = useState(ENDPOINTS[0].value)
  const [params, setParams] = useState<Record<string, string>>({})
  const [response, setResponse] = useState<string>(t("apiSandbox.clickSend"))
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)

  const endpoint = ENDPOINTS.find((e) => e.value === selected) ?? ENDPOINTS[0]

  const buildUrl = useCallback(() => {
    const url = new URL(endpoint.value, API_BASE)
    for (const [k, v] of Object.entries(params)) {
      if (v) url.searchParams.set(k, v)
    }
    return url.toString()
  }, [endpoint, params])

  const handleSend = useCallback(async () => {
    setLoading(true)
    setResponse("Sending request...")
    try {
      const url = buildUrl()
      const res = await fetch(url, {
        method: endpoint.method,
        headers: endpoint.method === "POST" ? { "Content-Type": "application/json" } : {},
        cache: "no-store",
      })
      const text = await res.text()
      try {
        const json = JSON.parse(text)
        setResponse(JSON.stringify(json, null, 2))
      } catch {
        setResponse(text || "(empty response)")
      }
    } catch (err) {
      setResponse(`Error: ${(err as Error).message}`)
    } finally {
      setLoading(false)
    }
  }, [endpoint, params, buildUrl])

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(response)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [response])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t("apiSandbox.title")}</h1>
        <p className="text-sm text-muted-foreground">{t("apiSandbox.subtitle")}</p>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Select value={selected} onValueChange={(v) => { setSelected(v); setParams({}) }}>
              <SelectTrigger className="w-full sm:w-[360px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ENDPOINTS.map((ep) => (
                  <SelectItem key={ep.value} value={ep.value}>
                    <span className={ep.method === "POST" ? "text-amber-500" : "text-green-500"}>
                      {ep.method}
                    </span>{" "}
                    {ep.value}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex-1 font-mono text-xs text-muted-foreground truncate">{buildUrl()}</div>
            <Button onClick={handleSend} disabled={loading} className="gap-1.5">
              <Play className="h-3.5 w-3.5" />
              {t("apiSandbox.send")}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="grid gap-6 lg:grid-cols-[1fr_1.5fr]">
          {/* Left: Description + Params */}
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-semibold">{endpoint.method} /{endpoint.value}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{endpoint.description}</p>
            </div>
            {endpoint.params && endpoint.params.length > 0 && (
              <div className="space-y-3">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Parameters</Label>
                {endpoint.params.map((p) => (
                  <div key={p.key} className="space-y-1">
                    <Label className="text-xs">{p.label}</Label>
                    <Input
                      value={params[p.key] ?? ""}
                      onChange={(e) => setParams((prev) => ({ ...prev, [p.key]: e.target.value }))}
                      placeholder={p.placeholder}
                      className="font-mono text-xs"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right: Response */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {t("apiSandbox.response")}
              </Label>
              <Button variant="ghost" size="sm" onClick={handleCopy} className="gap-1 h-7 text-xs">
                {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                {copied ? "Copied" : "Copy"}
              </Button>
            </div>
            <ScrollArea className="h-[500px] rounded-lg border bg-slate-950 p-4">
              <pre className="font-mono text-xs leading-relaxed text-green-400 whitespace-pre-wrap break-all">
                {response}
              </pre>
            </ScrollArea>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
