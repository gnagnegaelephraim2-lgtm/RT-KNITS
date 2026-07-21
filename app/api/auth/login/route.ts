import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { getSupabaseAdmin } from "@/lib/supabase/admin"

// Simple in-memory brute-force tracker (per server instance).
// After 5 failed attempts for a phone number within 10 minutes,
// the account is locked for 15 minutes.
const WINDOW_MS = 10 * 60 * 1000
const LOCK_MS = 15 * 60 * 1000
const MAX_ATTEMPTS = 5

type Attempt = { count: number; first: number; lockedUntil?: number }
const attempts = new Map<string, Attempt>()

function normalizePhone(p: string) {
  return p.replace(/[^\d+]/g, "")
}

function checkLock(phone: string): number | null {
  const a = attempts.get(phone)
  if (!a) return null
  if (a.lockedUntil && a.lockedUntil > Date.now()) {
    return Math.ceil((a.lockedUntil - Date.now()) / 60000)
  }
  return null
}

function recordFailure(phone: string) {
  const now = Date.now()
  const a = attempts.get(phone)
  if (!a || now - a.first > WINDOW_MS) {
    attempts.set(phone, { count: 1, first: now })
    return
  }
  a.count += 1
  if (a.count >= MAX_ATTEMPTS) {
    a.lockedUntil = now + LOCK_MS
  }
}

function clearAttempts(phone: string) {
  attempts.delete(phone)
}

export async function POST(request: Request) {
  let body: { phone_number?: string; pin?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 })
  }

  const phone_number = body.phone_number ? normalizePhone(body.phone_number) : ""
  const pin = (body.pin ?? "").trim()

  if (!phone_number || !pin) {
    return NextResponse.json({ error: "Phone number and PIN are required." }, { status: 400 })
  }

  const lockedMinutes = checkLock(phone_number)
  if (lockedMinutes) {
    return NextResponse.json(
      { error: `Too many attempts — try again in about ${lockedMinutes} minute(s).`, locked: true },
      { status: 429 },
    )
  }

  const supabase = getSupabaseAdmin()
  if (!supabase) {
    return NextResponse.json(
      {
        error:
          "Authentication is not configured. Set SUPABASE_SERVICE_ROLE_KEY and NEXT_PUBLIC_SUPABASE_URL to enable login.",
        notConfigured: true,
      },
      { status: 503 },
    )
  }

  // Look up by phone number, then verify PIN server-side.
  const { data: users, error } = await supabase
    .from("app_user")
    .select("user_id, full_name, role, phone_number, department_id, preferred_language, pin_hash")
    .eq("phone_number", phone_number)
    .limit(1)

  if (error) {
    return NextResponse.json({ error: "Login temporarily unavailable. Please try again." }, { status: 500 })
  }

  const record = users?.[0] as
    | { user_id: string; full_name: string; role: string; phone_number: string; department_id: string | null; preferred_language: string | null; pin_hash: string | null }
    | undefined

  const invalid = () => {
    recordFailure(phone_number)
    return NextResponse.json({ error: "Phone number or PIN incorrect." }, { status: 401 })
  }

  if (!record || !record.pin_hash) return invalid()

  // Support both bcrypt-hashed PINs and legacy plaintext PINs.
  const stored = record.pin_hash
  const looksHashed = /^\$2[aby]\$/.test(stored)
  const match = looksHashed ? await bcrypt.compare(pin, stored) : stored === pin

  if (!match) return invalid()

  clearAttempts(phone_number)

  return NextResponse.json({
    user: {
      user_id: record.user_id,
      role: record.role,
      full_name: record.full_name,
      phone_number: record.phone_number,
      department_id: record.department_id,
      preferred_language: record.preferred_language,
    },
  })
}
