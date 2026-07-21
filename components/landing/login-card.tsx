"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2, LogIn, ShieldAlert, ShieldCheck, Eye, EyeOff } from "lucide-react"
import { useAuth } from "@/components/auth/auth-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { validatePhone, sanitize, isSafe } from "@/lib/security"
import type { SessionUser } from "@/lib/types"

export function LoginCard() {
  const { login } = useAuth()
  const router = useRouter()
  const [phone, setPhone] = useState("")
  const [pin, setPin] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [showPin, setShowPin] = useState(false)
  const [phoneValid, setPhoneValid] = useState<boolean | null>(null)

  async function handlePhoneChange(value: string) {
    const cleaned = value.replace(/[^\d+\s-]/g, "")
    setPhone(cleaned)
    if (cleaned.length >= 8) {
      const valid = await validatePhone(cleaned)
      setPhoneValid(valid)
    } else {
      setPhoneValid(null)
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    const sanitizedPhone = await sanitize(phone.trim())
    const sanitizedPin = await sanitize(pin.trim())

    if (!sanitizedPhone || !sanitizedPin) {
      setError("Phone number or PIN incorrect.")
      return
    }

    if (!(await isSafe(sanitizedPhone)) || !(await isSafe(sanitizedPin))) {
      setError("Invalid input detected. Please check your entries.")
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone_number: sanitizedPhone,
          pin: sanitizedPin,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data?.error ?? "Phone number or PIN incorrect.")
        return
      }
      const user = data.user as SessionUser
      login(user)
      router.push(`/${user.role}`)
    } catch {
      setError("Login temporarily unavailable. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Card className="w-full max-w-md rounded-lg border-border shadow-sm">
      <CardHeader>
        <CardTitle className="text-xl">Log in</CardTitle>
        <CardDescription>Enter your registered phone number and PIN to access your portal.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="phone">Phone Number</Label>
            <div className="relative">
              <Input
                id="phone"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                placeholder="+230 5xxx xxxx"
                value={phone}
                onChange={(e) => handlePhoneChange(e.target.value)}
                className={`rounded-md pr-8 ${
                  phoneValid === true
                    ? "border-green-500 focus-visible:ring-green-500/20"
                    : phoneValid === false
                      ? "border-destructive focus-visible:ring-destructive/20"
                      : ""
                }`}
                aria-invalid={!!error}
              />
              {phoneValid !== null && (
                <span className="absolute right-2 top-1/2 -translate-y-1/2">
                  {phoneValid ? (
                    <ShieldCheck className="h-4 w-4 text-green-500" />
                  ) : (
                    <ShieldAlert className="h-4 w-4 text-destructive" />
                  )}
                </span>
              )}
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="pin">PIN</Label>
            <div className="relative">
              <Input
                id="pin"
                type={showPin ? "text" : "password"}
                inputMode="numeric"
                autoComplete="current-password"
                maxLength={6}
                placeholder="••••"
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
                className="rounded-md tracking-[0.4em] pr-8"
                aria-invalid={!!error}
              />
              <button
                type="button"
                onClick={() => setShowPin(!showPin)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                tabIndex={-1}
              >
                {showPin ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {error && (
            <div
              role="alert"
              className="flex items-start gap-2 border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive animate-in fade-in slide-in-from-top-1"
            >
              <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <Button type="submit" disabled={submitting} className="mt-1 gap-2 rounded-md">
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogIn className="h-4 w-4" />}
            {submitting ? "Signing in..." : "Log In"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
