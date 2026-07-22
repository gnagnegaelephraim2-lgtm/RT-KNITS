"use client"

import { useState } from "react"
import { useT } from "@/lib/i18n/i18n-provider"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface Field {
  name: string
  type: string
  key?: "PK" | "FK" | "UQ"
}

interface TableSchema {
  name: string
  fields: Field[]
  relationships?: string
}

const SCHEMAS: TableSchema[] = [
  {
    name: "department",
    fields: [
      { name: "department_id", type: "uuid", key: "PK" },
      { name: "name", type: "text" },
      { name: "created_at", type: "timestamptz" },
    ],
  },
  {
    name: "app_user",
    fields: [
      { name: "user_id", type: "uuid", key: "PK" },
      { name: "department_id", type: "uuid", key: "FK" },
      { name: "full_name", type: "text" },
      { name: "email", type: "text" },
      { name: "role", type: "text" },
      { name: "phone_number", type: "text", key: "UQ" },
      { name: "pin_hash", type: "text" },
      { name: "preferred_language", type: "text" },
      { name: "created_at", type: "timestamptz" },
      { name: "whatsapp_verified", type: "boolean" },
    ],
  },
  {
    name: "technician",
    fields: [
      { name: "technician_id", type: "uuid", key: "PK" },
      { name: "user_id", type: "uuid", key: "FK" },
      { name: "full_name", type: "text" },
      { name: "trade", type: "text" },
      { name: "active", type: "boolean" },
      { name: "created_at", type: "timestamptz" },
    ],
  },
  {
    name: "asset",
    fields: [
      { name: "asset_id", type: "uuid", key: "PK" },
      { name: "asset_code", type: "text", key: "UQ" },
      { name: "name", type: "text" },
      { name: "status", type: "text" },
      { name: "location", type: "text" },
      { name: "required_trade", type: "text" },
      { name: "last_preventive_check", type: "timestamptz" },
      { name: "preventive_interval_days", type: "integer" },
      { name: "created_at", type: "timestamptz" },
    ],
  },
  {
    name: "task_request",
    fields: [
      { name: "task_request_id", type: "uuid", key: "PK" },
      { name: "asset_id", type: "uuid", key: "FK" },
      { name: "created_by_user_id", type: "uuid", key: "FK" },
      { name: "status", type: "text" },
      { name: "priority", type: "integer" },
      { name: "requested_at", type: "timestamptz" },
      { name: "description", type: "text" },
      { name: "task_type", type: "text" },
      { name: "required_trade", type: "text" },
      { name: "created_by_role", type: "text" },
      { name: "approved_by_user_id", type: "uuid", key: "FK" },
      { name: "approved_at", type: "timestamptz" },
      { name: "rejection_reason", type: "text" },
    ],
    relationships: "asset_id -> asset.asset_id\ncreated_by_user_id -> app_user.user_id\napproved_by_user_id -> app_user.user_id",
  },
  {
    name: "work_order",
    fields: [
      { name: "work_order_id", type: "uuid", key: "PK" },
      { name: "task_request_id", type: "uuid", key: "FK" },
      { name: "status", type: "text" },
      { name: "priority", type: "integer" },
      { name: "scheduled_start", type: "timestamptz" },
      { name: "created_at", type: "timestamptz" },
      { name: "completed_at", type: "timestamptz" },
      { name: "recommended_technician_id", type: "uuid", key: "FK" },
      { name: "recommendation_reason", type: "text" },
    ],
    relationships: "task_request_id -> task_request.task_request_id\nrecommended_technician_id -> technician.technician_id",
  },
  {
    name: "work_order_technician",
    fields: [
      { name: "work_order_id", type: "uuid", key: "FK" },
      { name: "technician_id", type: "uuid", key: "FK" },
      { name: "start_time", type: "timestamptz" },
      { name: "stop_time", type: "timestamptz" },
      { name: "assigned_at", type: "timestamptz" },
      { name: "status", type: "text" },
    ],
    relationships: "work_order_id -> work_order.work_order_id\ntechnician_id -> technician.technician_id",
  },
  {
    name: "work_order_feedback",
    fields: [
      { name: "feedback_id", type: "uuid", key: "PK" },
      { name: "work_order_id", type: "uuid", key: "FK" },
      { name: "rated_by_user_id", type: "uuid", key: "FK" },
      { name: "feedback_type", type: "text" },
      { name: "feedback_text", type: "text" },
      { name: "voice_duration_seconds", type: "integer" },
      { name: "derived_sentiment", type: "text" },
      { name: "derived_rating", type: "integer" },
      { name: "key_issues", type: "jsonb" },
      { name: "flagged_for_review", type: "boolean" },
      { name: "reviewed_by_user_id", type: "uuid", key: "FK" },
      { name: "reviewed_at", type: "timestamptz" },
      { name: "created_at", type: "timestamptz" },
    ],
    relationships: "work_order_id -> work_order.work_order_id\nrated_by_user_id -> app_user.user_id",
  },
  {
    name: "message_log",
    fields: [
      { name: "log_id", type: "uuid", key: "PK" },
      { name: "user_id", type: "uuid", key: "FK" },
      { name: "user_name", type: "text" },
      { name: "phone_number", type: "text" },
      { name: "direction", type: "text" },
      { name: "message_type", type: "text" },
      { name: "content", type: "text" },
      { name: "media_url", type: "text" },
      { name: "transcription", type: "text" },
      { name: "metadata", type: "jsonb" },
      { name: "created_at", type: "timestamptz" },
    ],
  },
  {
    name: "conversation_state",
    fields: [
      { name: "phone_number", type: "text", key: "PK" },
      { name: "state", type: "text" },
      { name: "last_context", type: "jsonb" },
      { name: "updated_at", type: "timestamptz" },
    ],
  },
]

function KeyBadge({ type }: { type?: string }) {
  if (!type) return null
  const colors =
    type === "PK"
      ? "bg-indigo-500/15 text-indigo-400 border-indigo-500/30"
      : type === "FK"
        ? "bg-amber-500/15 text-amber-400 border-amber-500/30"
        : "bg-cyan-500/15 text-cyan-400 border-cyan-500/30"
  return (
    <Badge variant="outline" className={`text-[10px] font-bold px-1.5 py-0 ${colors}`}>
      {type}
    </Badge>
  )
}

export default function DataModelPage() {
  const t = useT()
  const [selected, setSelected] = useState(SCHEMAS[0].name)

  const table = SCHEMAS.find((s) => s.name === selected) ?? SCHEMAS[0]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t("dataModel.title")}</h1>
        <p className="text-sm text-muted-foreground">{t("dataModel.subtitle")}</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
        {/* Table List */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {t("dataModel.tables")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-0.5 p-2">
            {SCHEMAS.map((s) => (
              <button
                key={s.name}
                onClick={() => setSelected(s.name)}
                className={cn(
                  "w-full rounded-md px-3 py-2 text-left text-sm font-medium transition-colors",
                  selected === s.name
                    ? "bg-indigo-500/10 text-indigo-400"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                {s.name}
                <span className="ml-1.5 text-[10px] text-muted-foreground/60">({s.fields.length})</span>
              </button>
            ))}
          </CardContent>
        </Card>

        {/* Schema Viewer */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="font-mono text-sm">TABLE {table.name}</CardTitle>
              <Badge variant="outline" className="text-xs">
                {table.fields.length} fields
              </Badge>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Field</th>
                      <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Type</th>
                      <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Key</th>
                    </tr>
                  </thead>
                  <tbody>
                    {table.fields.map((f) => (
                      <tr key={f.name} className="border-b last:border-0 hover:bg-muted/30">
                        <td className="px-4 py-2.5 font-mono text-xs font-medium">{f.name}</td>
                        <td className="px-4 py-2.5 font-mono text-xs text-muted-foreground">{f.type}</td>
                        <td className="px-4 py-2.5"><KeyBadge type={f.key} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Relationships */}
          {table.relationships && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {t("dataModel.relationships")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="rounded-lg border bg-muted/30 p-4 font-mono text-xs leading-relaxed text-muted-foreground whitespace-pre-wrap">
                  {table.relationships}
                </pre>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
