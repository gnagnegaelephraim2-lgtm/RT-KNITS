"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { Send, Trash2, Zap, AlertTriangle, Info } from "lucide-react"
import { useT } from "@/lib/i18n/i18n-provider"
import { useLookups } from "@/lib/hooks/use-lookups"
import { NitaApi } from "@/lib/api"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"

interface ChatMessage {
  id: string
  direction: "inbound" | "outbound"
  text: string
  timestamp: string
}

interface LogEntry {
  id: string
  time: string
  type: "info" | "success" | "warn" | "error"
  text: string
}

const SCENARIOS = [
  {
    id: "critical_leak",
    labelKey: "simulator.critical",
    descKey: "simulator.criticalDesc",
    message: "URGENT: Grinding noise on Circular Knitter CK-8, production line stopped!",
    priority: "critical" as const,
    icon: Zap,
    color: "text-red-500",
    bg: "bg-red-500/10 border-red-500/30",
  },
  {
    id: "urgent_tension",
    labelKey: "simulator.urgent",
    descKey: "simulator.urgentDesc",
    message: "Gerber cutter belt slipping on Row 1, tension inconsistent.",
    priority: "high" as const,
    icon: AlertTriangle,
    color: "text-amber-500",
    bg: "bg-amber-500/10 border-amber-500/30",
  },
  {
    id: "normal_cosmetic",
    labelKey: "simulator.normal",
    descKey: "simulator.normalDesc",
    message: "Office door latch is broken, needs replacement.",
    priority: "medium" as const,
    icon: Info,
    color: "text-blue-500",
    bg: "bg-blue-500/10 border-blue-500/30",
  },
]

function parsePriority(text: string): { priority: number; label: string } {
  const lower = text.toLowerCase()
  if (/\bp0\b|critical|emergency|stop|grinding|gro bwi|production down/i.test(lower)) {
    return { priority: 0, label: "P0 CRITICAL" }
  }
  if (/\bp1\b|urgent|asap|leak|water|sliding|belt|high/i.test(lower)) {
    return { priority: 1, label: "P1 URGENT" }
  }
  return { priority: 2, label: "P2 NORMAL" }
}

function extractAsset(text: string, assets: { asset_code: string; name: string; asset_id: string }[]): { code: string; name: string; id: string } | null {
  const match = text.match(/(?:machine|asset|line|#|code)\s*#?\s*([0-9]+)/i) || text.match(/\b([0-9]{1,4})\b/)
  if (!match) return null
  const code = match[1]
  const found = assets.find((a) => a.asset_code === code)
  if (found) return { code: found.asset_code, name: found.name, id: found.asset_id }
  return { code, name: `Machine #${code}`, id: code }
}

function uid(): string {
  const arr = new Uint8Array(8)
  crypto.getRandomValues(arr)
  return Array.from(arr, (b) => b.toString(16).padStart(2, "0")).join("")
}

export default function SimulatorPage() {
  const t = useT()
  const { assets } = useLookups()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [input, setInput] = useState("")
  const [awaitingDetails, setAwaitingDetails] = useState(false)
  const chatRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight
    }
  }, [messages, logs])

  const addLog = useCallback((type: LogEntry["type"], text: string) => {
    setLogs((prev) => [
      ...prev,
      { id: uid(), time: new Date().toLocaleTimeString(), type, text },
    ])
  }, [])

  const addMessage = useCallback((direction: ChatMessage["direction"], text: string) => {
    setMessages((prev) => [
      ...prev,
      { id: uid(), direction, text, timestamp: new Date().toISOString() },
    ])
  }, [])

  const processMessage = useCallback(
    async (text: string) => {
      const now = new Date().toLocaleTimeString()
      const lower = text.toLowerCase()
      const isGreeting = /^(hi|hello|hey|bonjour|nita|salut)\b/i.test(lower) && text.length < 20

      if (isGreeting) {
        setAwaitingDetails(true)
        addLog("info", "Greeting detected. Prompting operator for issue details...")
        addMessage("outbound", "Hello! I am the Nita Dispatch Bot. Please describe your maintenance issue (e.g. machine number, problem description, urgency P0/P1/P2) so I can log it for dispatch.")
        return
      }

      addLog("info", "Processing message text with NLP entity parser...")

      const { priority, label } = parsePriority(text)
      const asset = extractAsset(text, assets)
      const assetName = asset?.name ?? "Unknown Asset"
      const assetCode = asset?.code ?? "Unknown"

      addLog("success", `Slot Extracted -> Asset: ${assetName} (Code: ${assetCode}), Priority: ${label}`)

      // Create task via API
      try {
        const res = await NitaApi.taskLifecycle({
          action: "create",
          asset_code: assetCode,
          asset_name: assetName,
          description: text,
          priority,
          task_type: priority === 0 ? "emergency" : "repair",
        })
        if (res.ok) {
          addLog("success", `Task created via API: ${JSON.stringify(res.data)}`)
        } else {
          addLog("warn", `API returned ${res.status}: ${res.error || "unknown error"}`)
        }
      } catch (err) {
        addLog("error", `API call failed: ${(err as Error).message}`)
      }

      // Generate reply
      let reply = ""
      if (priority === 0) {
        reply = `🚨 **P0 CRITICAL** task created for ${assetName}. Line operator advised to STOP. Mechanic dispatched immediately.`
        addLog("warn", "Escalating to P0 CRITICAL. Dispatching mechanic...")
      } else if (priority === 1) {
        reply = `⚠️ **P1 URGENT** task created for ${assetName}. Request logged and submitted to Coordinator Dashboard for approval.`
        addLog("success", `Logged P1 Urgent task request for ${assetName}.`)
      } else {
        reply = `ℹ️ Routine **P2 Normal** task request logged for ${assetName}. Scheduled for next maintenance window.`
        addLog("info", "Logged P2 routine task request.")
      }

      addMessage("outbound", reply)
      setAwaitingDetails(false)
    },
    [assets, addLog, addMessage],
  )

  const handleSend = useCallback(() => {
    const text = input.trim()
    if (!text) return
    setInput("")
    addMessage("inbound", text)
    addLog("info", `User: ${text}`)
    processMessage(text)
  }, [input, addMessage, addLog, processMessage])

  const handlePreset = useCallback(
    (scenario: (typeof SCENARIOS)[number]) => {
      addMessage("inbound", scenario.message)
      addLog("info", `Scenario: ${scenario.id} (${scenario.priority})`)
      processMessage(scenario.message)
    },
    [addMessage, addLog, processMessage],
  )

  const clearLogs = useCallback(() => {
    setLogs([])
  }, [])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t("simulator.title")}</h1>
        <p className="text-sm text-muted-foreground">{t("simulator.subtitle")}</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
        {/* Phone Mockup */}
        <Card className="overflow-hidden border-0 bg-[#0b141a] text-white shadow-2xl">
          {/* Notch */}
          <div className="flex justify-center bg-[#1a1a1a] py-1.5">
            <div className="h-1 w-20 rounded-full bg-[#333]" />
          </div>
          {/* Header */}
          <div className="flex items-center gap-3 border-b border-[#2a3942] bg-[#1f2c34] px-4 py-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-500 text-xs font-bold">
              RT
            </div>
            <div>
              <div className="text-sm font-semibold text-[#e9edef]">{t("simulator.dispatcher")}</div>
              <div className="text-xs text-[#8696a0]">{t("simulator.online")}</div>
            </div>
          </div>
          {/* Chat */}
          <ScrollArea ref={chatRef} className="h-[400px] bg-[#0b141a] p-3">
            <div className="flex flex-col gap-2.5">
              {messages.length === 0 && (
                <div className="flex items-center justify-center py-16 text-sm text-[#8696a0]">
                  Send a message to start testing
                </div>
              )}
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`max-w-[80%] rounded-xl px-3.5 py-2.5 text-sm leading-relaxed ${
                    msg.direction === "inbound"
                      ? "self-start rounded-bl-sm bg-[#1f2c34] text-[#e9edef]"
                      : "self-end rounded-br-sm bg-[#005c4b] text-[#e9edef]"
                  }`}
                >
                  {msg.text}
                </div>
              ))}
            </div>
          </ScrollArea>
          {/* Input */}
          <div className="flex items-center gap-2.5 border-t border-[#2a3942] bg-[#1f2c34] px-3 py-2.5">
            <Input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder={t("simulator.placeholder")}
              className="flex-1 rounded-full border-0 bg-[#2a3942] text-sm text-[#e9edef] placeholder-[#8696a0] focus-visible:ring-0"
            />
            <Button
              size="icon"
              onClick={handleSend}
              className="h-10 w-10 shrink-0 rounded-full bg-indigo-500 text-white hover:bg-indigo-400"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </Card>

        {/* Right Panel */}
        <div className="flex flex-col gap-4">
          {/* Presets */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                {t("simulator.presets")}
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-3 gap-3">
              {SCENARIOS.map((s) => {
                const Icon = s.icon
                return (
                  <button
                    key={s.id}
                    onClick={() => handlePreset(s)}
                    className={`rounded-xl border p-4 text-left transition-all hover:-translate-y-0.5 hover:shadow-md ${s.bg}`}
                  >
                    <div className={`mb-2 flex items-center gap-1.5 text-xs font-bold ${s.color}`}>
                      <Icon className="h-3.5 w-3.5" />
                      {t(s.labelKey)}
                    </div>
                    <div className="text-xs text-muted-foreground leading-relaxed">{t(s.descKey)}</div>
                  </button>
                )
              })}
            </CardContent>
          </Card>

          {/* System Logs */}
          <Card className="flex flex-1 flex-col">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-500 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
                </span>
                {t("simulator.logs")}
              </CardTitle>
              <Button variant="outline" size="sm" onClick={clearLogs} className="gap-1.5">
                <Trash2 className="h-3 w-3" />
                {t("simulator.clear")}
              </Button>
            </CardHeader>
            <CardContent className="flex-1 overflow-auto rounded-b-lg bg-slate-950 p-3 font-mono text-xs leading-relaxed text-slate-400">
              {logs.length === 0 && (
                <div className="py-8 text-center text-slate-600">System logs will appear here...</div>
              )}
              {logs.map((log) => (
                <div key={log.id} className="py-0.5">
                  <span className="text-slate-600">[{log.time}]</span>{" "}
                  <span
                    className={
                      log.type === "success"
                        ? "text-green-400"
                        : log.type === "warn"
                          ? "text-amber-400"
                          : log.type === "error"
                            ? "text-red-400 font-semibold"
                            : "text-slate-400"
                    }
                  >
                    {log.text}
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
