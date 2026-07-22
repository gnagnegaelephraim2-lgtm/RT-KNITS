"use client"

import { useState } from "react"
import { BookOpen, Cpu, Database, TrendingUp } from "lucide-react"
import { useT } from "@/lib/i18n/i18n-provider"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

const SECTIONS = [
  {
    id: "design",
    labelKey: "docs.solutionDesign",
    icon: BookOpen,
  },
  {
    id: "logic",
    labelKey: "docs.decisionLogic",
    icon: Cpu,
  },
  {
    id: "model",
    labelKey: "docs.dataModel",
    icon: Database,
  },
  {
    id: "impact",
    labelKey: "docs.businessImpact",
    icon: TrendingUp,
  },
]

function DesignSection() {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold tracking-tight">Solution Design</h2>
      <p className="text-muted-foreground leading-relaxed">
        NITA (Next-generation Intelligent Triage Assistant) automates maintenance triage and routing
        bottlenecks for RT Knits in Mauritius. It replaces legacy FileMaker coordinator bottlenecks
        with an automated AI routing assistant for maintenance tasks.
      </p>

      <h3 className="text-lg font-semibold">System Architecture</h3>
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="border-indigo-500/20 bg-indigo-500/5">
          <CardContent className="pt-6">
            <div className="mb-2 text-sm font-bold text-indigo-400">Frontend</div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Next.js 16 + React 19 + Tailwind CSS + shadcn/ui. Server-side rendering with App Router.
              Type-safe with TypeScript. Responsive across all screen sizes.
            </p>
          </CardContent>
        </Card>
        <Card className="border-green-500/20 bg-green-500/5">
          <CardContent className="pt-6">
            <div className="mb-2 text-sm font-bold text-green-400">Database</div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Supabase PostgreSQL with PostgREST API. Row-level security policies. Real-time subscriptions.
              Managed schema with migrations.
            </p>
          </CardContent>
        </Card>
        <Card className="border-amber-500/20 bg-amber-500/5">
          <CardContent className="pt-6">
            <div className="mb-2 text-sm font-bold text-amber-400">Integration Engine</div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              n8n Webhook workflow engine for WhatsApp Creole/English voice-to-task triage pipeline.
              Meta WhatsApp Business API integration.
            </p>
          </CardContent>
        </Card>
      </div>

      <h3 className="text-lg font-semibold">Key Features</h3>
      <ul className="space-y-2 text-sm text-muted-foreground">
        <li className="flex items-start gap-2">
          <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-400" />
          WhatsApp-based voice/text maintenance reporting in Creole, English, French, and Hindi
        </li>
        <li className="flex items-start gap-2">
          <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-green-400" />
          AI-powered priority classification (P0 Critical / P1 Urgent / P2 Normal)
        </li>
        <li className="flex items-start gap-2">
          <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-400" />
          Automated technician dispatch based on trade matching and workload
        </li>
        <li className="flex items-start gap-2">
          <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-cyan-400" />
          Real-time dashboard with Kanban board, analytics, and SLA tracking
        </li>
        <li className="flex items-start gap-2">
          <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-purple-400" />
          Role-based access: Operator, Technician, Coordinator/Admin portals
        </li>
      </ul>
    </div>
  )
}

function LogicSection() {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold tracking-tight">Decision Logic &amp; NLP Triage</h2>
      <p className="text-muted-foreground leading-relaxed">
        Automatic priority classification matrix converts raw text/voice into actionable SLA categories
        through the NITA NLP engine.
      </p>

      <div className="space-y-4">
        <div className="rounded-xl border border-red-500/30 bg-red-500/5 p-5">
          <div className="flex items-center gap-3 mb-3">
            <Badge className="bg-red-500/20 text-red-400 border-red-500/30">P0 CRITICAL</Badge>
            <span className="text-sm font-semibold text-red-400">Line Stop / Production Halt</span>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Immediate dispatch notification. Mechanic is dispatched within minutes. Operator is
            advised to STOP production. Keywords: grinding, stop, emergency, production down, critical,
            gro bwi (Creole).
          </p>
        </div>

        <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-5">
          <div className="flex items-center gap-3 mb-3">
            <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">P1 URGENT</Badge>
            <span className="text-sm font-semibold text-amber-400">Component Fault / High Risk</span>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Same-shift repair approval. Task submitted to Coordinator Dashboard for review and
            dispatch. Keywords: urgent, asap, leak, water, belt, sliding, poorly.
          </p>
        </div>

        <div className="rounded-xl border border-blue-500/30 bg-blue-500/5 p-5">
          <div className="flex items-center gap-3 mb-3">
            <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">P2 NORMAL</Badge>
            <span className="text-sm font-semibold text-blue-400">Cosmetic / Scheduled Preventive Care</span>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Scheduled for next maintenance window. Non-urgent improvements and cosmetic repairs.
            Keywords: routine, cosmetic, door, latch, light, paint, normal.
          </p>
        </div>
      </div>

      <h3 className="text-lg font-semibold">Asset Extraction</h3>
      <p className="text-sm text-muted-foreground leading-relaxed">
        The NLP engine extracts asset identifiers from messages using pattern matching:
        <code className="mx-1 rounded bg-muted px-1.5 py-0.5 font-mono text-xs">machine #39</code>,
        <code className="mx-1 rounded bg-muted px-1.5 py-0.5 font-mono text-xs">asset 175</code>,
        <code className="mx-1 rounded bg-muted px-1.5 py-0.5 font-mono text-xs">line 88</code>.
        Extracted codes are matched against the asset registry for automatic linking.
      </p>
    </div>
  )
}

function ModelSection() {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold tracking-tight">Data Model Analysis</h2>
      <p className="text-muted-foreground leading-relaxed">
        Relational entities linking departments, assets, task requests, and work orders into a
        unified maintenance lifecycle.
      </p>

      <div className="rounded-xl border bg-muted/30 p-6">
        <pre className="font-mono text-xs leading-relaxed text-muted-foreground whitespace-pre-wrap">
{`department (1) ──── (N) asset (1) ──── (N) task_request (1) ──── (1) work_order (N) ──── technician
     │                        │                    │                        │                    │
     │                        │                    │                        │                    │
     └── department_id        └── asset_id         └── task_request_id      └── work_order_id    └── technician_id
         (PK)                     (PK)                  (PK)                    (PK)                  (PK)`}
        </pre>
      </div>

      <h3 className="text-lg font-semibold">Core Entities</h3>
      <div className="grid gap-3 sm:grid-cols-2">
        {[
          { name: "department", desc: "Organizational units (Knitting, Cutting, Dyeing, etc.)" },
          { name: "asset", desc: "Factory machines and equipment with codes, status, and location" },
          { name: "app_user", desc: "All system users with roles (operator, technician, admin)" },
          { name: "technician", desc: "Specialized maintenance staff with trade classifications" },
          { name: "task_request", desc: "Maintenance requests from operators with priority and status" },
          { name: "work_order", desc: "Approved tasks dispatched to technicians with scheduling" },
          { name: "work_order_feedback", desc: "Post-completion ratings and commendations" },
          { name: "message_log", desc: "WhatsApp message audit trail for all conversations" },
        ].map((e) => (
          <Card key={e.name} className="p-4">
            <div className="font-mono text-xs font-bold text-indigo-400">{e.name}</div>
            <div className="mt-1 text-xs text-muted-foreground">{e.desc}</div>
          </Card>
        ))}
      </div>
    </div>
  )
}

function ImpactSection() {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold tracking-tight">Business Impact &amp; SLA Targets</h2>
      <p className="text-muted-foreground leading-relaxed">
        Eliminates FileMaker coordinator delay and reduces Mean Time To Repair (MTTR) by 45%
        across RT Knits production floors.
      </p>

      <div className="grid gap-4 sm:grid-cols-4">
        {[
          { value: "99.8%", label: "Plant SLA Target", color: "text-green-400" },
          { value: "-45%", label: "MTTR Reduction", color: "text-indigo-400" },
          { value: "< 5min", label: "P0 Response Time", color: "text-red-400" },
          { value: "4", label: "Languages Supported", color: "text-amber-400" },
        ].map((stat) => (
          <Card key={stat.label} className="p-5 text-center">
            <div className={`text-3xl font-extrabold ${stat.color}`}>{stat.value}</div>
            <div className="mt-1 text-xs font-medium text-muted-foreground uppercase tracking-wider">
              {stat.label}
            </div>
          </Card>
        ))}
      </div>

      <h3 className="text-lg font-semibold">Key Benefits</h3>
      <ul className="space-y-3 text-sm text-muted-foreground">
        <li className="flex items-start gap-3">
          <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-green-500/15 text-xs font-bold text-green-400">1</span>
          <div><strong className="text-foreground">Eliminated Coordinator Bottleneck</strong> — Operators report directly via WhatsApp, no manual handoff needed.</div>
        </li>
        <li className="flex items-start gap-3">
          <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-green-500/15 text-xs font-bold text-green-400">2</span>
          <div><strong className="text-foreground">Automated Priority Routing</strong> — AI classifies urgency instantly, critical issues get immediate dispatch.</div>
        </li>
        <li className="flex items-start gap-3">
          <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-green-500/15 text-xs font-bold text-green-400">3</span>
          <div><strong className="text-foreground">Trade-Matched Dispatch</strong> — Technicians receive tasks matching their specialization automatically.</div>
        </li>
        <li className="flex items-start gap-3">
          <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-green-500/15 text-xs font-bold text-green-400">4</span>
          <div><strong className="text-foreground">Full Audit Trail</strong> — Every message, approval, and status change is logged with timestamps and actor identity.</div>
        </li>
        <li className="flex items-start gap-3">
          <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-green-500/15 text-xs font-bold text-green-400">5</span>
          <div><strong className="text-foreground">Multilingual Support</strong> — English, French, Kreol Morisien, and Hindi for inclusive factory workforce.</div>
        </li>
      </ul>
    </div>
  )
}

const CONTENT: Record<string, () => JSX.Element> = {
  design: DesignSection,
  logic: LogicSection,
  model: ModelSection,
  impact: ImpactSection,
}

export default function DocsPage() {
  const t = useT()
  const [active, setActive] = useState("design")

  const ContentComponent = CONTENT[active] ?? DesignSection

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t("docs.title")}</h1>
        <p className="text-sm text-muted-foreground">{t("docs.subtitle")}</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
        {/* TOC */}
        <Card>
          <CardContent className="space-y-0.5 p-2">
            {SECTIONS.map((s) => {
              const Icon = s.icon
              return (
                <button
                  key={s.id}
                  onClick={() => setActive(s.id)}
                  className={cn(
                    "flex w-full items-center gap-2.5 rounded-md px-3 py-2.5 text-left text-sm font-medium transition-colors",
                    active === s.id
                      ? "bg-indigo-500/10 text-indigo-400"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="flex-1">{t(s.labelKey)}</span>
                </button>
              )
            })}
          </CardContent>
        </Card>

        {/* Content */}
        <Card className="p-6 lg:p-8">
          <ContentComponent />
        </Card>
      </div>
    </div>
  )
}
