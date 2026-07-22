"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2, LogIn, ShieldAlert, ShieldCheck, Eye, EyeOff, Globe } from "lucide-react"
import { useAuth } from "@/components/auth/auth-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { validatePhone, sanitize, isSafe } from "@/lib/security"
import { useI18n } from "@/lib/i18n/i18n-provider"
import { LOCALES } from "@/lib/i18n/dictionaries"
import type { SessionUser } from "@/lib/types"

export function LoginCard() {
  const { login } = useAuth()
  const router = useRouter()
  const { locale, t, setLocale } = useI18n()
  
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
      setError(t("login.errorRequired"))
      return
    }

    if (!(await isSafe(sanitizedPhone)) || !(await isSafe(sanitizedPin))) {
      setError(t("login.errorInvalid"))
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
        let errorMsg = data?.error
        if (errorMsg === "Phone number or PIN incorrect.") {
          errorMsg = t("login.errorIncorrect")
        } else if (errorMsg?.includes("Too many attempts")) {
          const mMatch = errorMsg.match(/about (\d+) minute/)
          const mins = mMatch ? parseInt(mMatch[1]) : 15
          errorMsg = t("login.errorLock", { minutes: mins })
        }
        setError(errorMsg ?? t("login.errorIncorrect"))
        return
      }
      const user = data.user as SessionUser
      login(user)
      router.push(`/${user.role}`)
    } catch {
      setError(t("states.errorDefault"))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Card className="w-full max-w-md border border-white/10 bg-card/60 backdrop-blur-xl shadow-2xl transition-all duration-300 hover:shadow-primary/5 rounded-2xl overflow-hidden">
      <CardHeader className="border-b border-border/30 pb-6 relative">
        <div className="flex items-center justify-between gap-4">
          <CardTitle className="text-2xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
            {t("login.title")}
          </CardTitle>
          
          {/* Subtle localized switcher */}
          <div className="flex items-center gap-1 bg-muted/50 p-1 border border-border/30 rounded-lg">
            <Globe className="h-3 w-3 text-muted-foreground ml-1" />
            <select
              value={locale}
              onChange={(e) => setLocale(e.target.value as any)}
              className="bg-transparent text-xs font-medium text-foreground focus:outline-none cursor-pointer pr-1 py-0.5 border-none select-none uppercase"
            >
              {(Object.keys(LOCALES) as Array<keyof typeof LOCALES>).map((lang) => (
                <option key={lang} value={lang} className="bg-background text-foreground uppercase">
                  {lang === "kreol" ? "kr" : lang}
                </option>
              ))}
            </select>
          </div>
        </div>
        <CardDescription className="mt-2 text-sm text-muted-foreground text-balance">
          {t("login.description")}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="pt-6">
        <form onSubmit={onSubmit} className="flex flex-col gap-5" noValidate>
          <div className="flex flex-col gap-2">
            <Label htmlFor="phone" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {t("login.phone")}
            </Label>
            <div className="relative">
              <Input
                id="phone"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                placeholder={t("login.phonePlaceholder")}
                value={phone}
                onChange={(e) => handlePhoneChange(e.target.value)}
                className={`rounded-xl h-11 pr-10 border border-border/80 bg-background/50 focus-visible:ring-primary/20 transition-all ${
                  phoneValid === true
                    ? "border-green-500/80 focus-visible:ring-green-500/10 focus-visible:border-green-500"
                    : phoneValid === false
                      ? "border-destructive/80 focus-visible:ring-destructive/10 focus-visible:border-destructive"
                      : ""
                }`}
                aria-invalid={!!error}
              />
              {phoneValid !== null && (
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 flex items-center transition-all duration-300">
                  {phoneValid ? (
                    <ShieldCheck className="h-5 w-5 text-green-500 animate-in zoom-in-50 duration-200" />
                  ) : (
                    <ShieldAlert className="h-5 w-5 text-destructive animate-in shake-50 duration-200" />
                  )}
                </span>
              )}
            </div>
          </div>
          
          <div className="flex flex-col gap-2">
            <Label htmlFor="pin" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {t("login.pin")}
            </Label>
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
                className="rounded-xl h-11 tracking-[0.4em] pr-12 border border-border/80 bg-background/50 focus-visible:ring-primary/20 transition-all"
                aria-invalid={!!error}
              />
              <button
                type="button"
                onClick={() => setShowPin(!showPin)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1 rounded-md hover:bg-muted/40"
                tabIndex={-1}
              >
                {showPin ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {error && (
            <div
              role="alert"
              className="flex items-start gap-2.5 border border-destructive/30 bg-destructive/5 px-4 py-3 rounded-xl text-sm text-destructive animate-in fade-in slide-in-from-top-2 duration-300"
            >
              <ShieldAlert className="mt-0.5 h-4.5 w-4.5 shrink-0" />
              <span className="leading-snug">{error}</span>
            </div>
          )}

          <Button type="submit" disabled={submitting} className="mt-2 h-11 gap-2 rounded-xl bg-primary text-primary-foreground hover:bg-primary/95 transition-all shadow-md font-semibold text-sm hover:translate-y-[-1px] active:translate-y-[0px] duration-150">
            {submitting ? <Loader2 className="h-4.5 w-4.5 animate-spin" /> : <LogIn className="h-4.5 w-4.5" />}
            {submitting ? t("login.submitting") : t("login.submit")}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
