// External REST API used for ALL writes so the dashboard and the WhatsApp bot
// stay perfectly consistent. Never duplicate this business logic client-side.
// Request signing via Rust WASM HMAC-SHA256 for tamper detection.

import { signRequest, generateNonce } from "@/lib/security"

export const API_BASE = "https://bot.nelsonfodjo.me/webhook/"

// Shared secret for HMAC signing — in production, load from env/server
const API_SECRET = process.env.NEXT_PUBLIC_API_SECRET ?? "nita-dashboard-hmac-secret"

export interface ApiResult<T = unknown> {
  ok: boolean
  status: number
  data: T | null
  error?: string
}

function buildUrl(path: string, params?: Record<string, string | number | undefined | null>) {
  const url = new URL(path, API_BASE)
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined && v !== null && v !== "") url.searchParams.set(k, String(v))
    }
  }
  return url.toString()
}

async function signHeaders(bodyStr: string): Promise<Record<string, string>> {
  try {
    const nonce = await generateNonce()
    const signature = await signRequest(bodyStr, API_SECRET)
    return {
      "X-Request-Nonce": nonce,
      "X-Request-Signature": signature,
      "X-Timestamp": String(Math.floor(Date.now() / 1000)),
    }
  } catch {
    // WASM not loaded yet — proceed without signing
    return {}
  }
}

export async function apiGet<T = unknown>(
  path: string,
  params?: Record<string, string | number | undefined | null>,
): Promise<ApiResult<T>> {
  try {
    const url = buildUrl(path, params)
    const nonce = await generateNonce().catch(() => "")
    const headers: Record<string, string> = {
      Accept: "application/json",
      "X-Request-Nonce": nonce,
      "X-Timestamp": String(Math.floor(Date.now() / 1000)),
    }
    const res = await fetch(url, {
      method: "GET",
      headers,
      cache: "no-store",
    })
    const data = await safeJson(res)
    return { ok: res.ok, status: res.status, data: data as T }
  } catch (err) {
    return { ok: false, status: 0, data: null, error: (err as Error).message }
  }
}

export async function apiPost<T = unknown>(path: string, body: unknown): Promise<ApiResult<T>> {
  try {
    const bodyStr = JSON.stringify(body)
    const signedHeaders = await signHeaders(bodyStr)
    const res = await fetch(buildUrl(path), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        ...signedHeaders,
      },
      body: bodyStr,
      cache: "no-store",
    })
    const data = await safeJson(res)
    return { ok: res.ok, status: res.status, data: data as T }
  } catch (err) {
    return { ok: false, status: 0, data: null, error: (err as Error).message }
  }
}

async function safeJson(res: Response): Promise<unknown> {
  const text = await res.text()
  if (!text) return null
  try {
    return JSON.parse(text)
  } catch {
    return { raw: text }
  }
}

// Typed endpoint wrappers -----------------------------------------------------

export const NitaApi = {
  getAsset: (code: string) => apiGet(`api-assets`, { code }),
  findAsset: (location?: string, keyword?: string) => apiGet(`api-find-asset`, { location, keyword }),
  technicians: (trade?: string) => apiGet(`api-technicians`, { trade }),
  recommendTechnician: (trade?: string) => apiGet(`api-recommend-technician`, { trade }),
  taskLifecycle: (body: Record<string, unknown>) => apiPost(`api-task-lifecycle`, body),
  technicianActions: (body: {
    work_order_id: string
    technician_phone: string
    action: "start" | "done" | "decline" | "acknowledge"
  }) => apiPost(`api-technician-actions`, body),
  technicianDailyTasks: (technician_id: string) => apiGet(`api-technician-daily-tasks`, { technician_id }),
  nextTask: (technician_id: string) => apiGet(`api-next-task`, { technician_id }),
  adminAssign: (body: Record<string, unknown>) => apiPost(`api-admin-assign`, body),
  pendingApprovals: () => apiGet(`api-pending-approvals`),
  adminStatus: () => apiGet(`api-admin-status`),
  adminRead: (table: string, opts?: { filter_field?: string; filter_value?: string; limit?: number }) =>
    apiGet(`api-admin-read`, { table, ...opts }),
  feedback: (body: Record<string, unknown>) => apiPost(`api-feedback`, body),
  forwardMedia: (body: { task_id: string; recipient_phone: string }) => apiPost(`api-forward-media`, body),
}
