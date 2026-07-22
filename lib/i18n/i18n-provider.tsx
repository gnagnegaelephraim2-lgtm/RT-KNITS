"use client"

import { createContext, useCallback, useContext, useEffect, useState, useMemo } from "react"
import { useAuth } from "@/components/auth/auth-provider"
import { DEFAULT_LOCALE, DICTIONARIES, type Locale } from "./dictionaries"

type Vars = Record<string, string | number>

interface I18nContextValue {
  locale: Locale
  t: (key: string, vars?: Vars) => string
  setLocale: (locale: Locale) => void
}

const I18nContext = createContext<I18nContextValue | null>(null)

function interpolate(template: string, vars?: Vars) {
  if (!vars) return template
  return template.replace(/\{(\w+)\}/g, (match, name) => (name in vars ? String(vars[name]) : match))
}

function isSupportedLocale(value: string | null | undefined): value is Locale {
  return !!value && value in DICTIONARIES
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const { user, updateUser } = useAuth()
  const [guestLocale, setGuestLocale] = useState<Locale>(DEFAULT_LOCALE)

  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = window.localStorage.getItem("nita_guest_locale")
      if (isSupportedLocale(stored)) {
        setGuestLocale(stored)
      }
    }
  }, [])

  const locale = useMemo(() => {
    if (user?.preferred_language && isSupportedLocale(user.preferred_language)) {
      return user.preferred_language
    }
    return guestLocale
  }, [user?.preferred_language, guestLocale])

  const setLocale = useCallback((newLocale: Locale) => {
    if (user) {
      updateUser({ preferred_language: newLocale })
    } else {
      if (typeof window !== "undefined") {
        window.localStorage.setItem("nita_guest_locale", newLocale)
      }
      setGuestLocale(newLocale)
    }
  }, [user, updateUser])

  const t = useMemo(() => {
    return (key: string, vars?: Vars) => {
      // Plural key convention: pass vars.count and a "<key>_plural" entry to select it.
      const pluralKey = vars && typeof vars.count === "number" && vars.count !== 1 ? `${key}_plural` : key
      const dict = DICTIONARIES[locale]
      const template = dict[pluralKey] ?? dict[key] ?? DICTIONARIES[DEFAULT_LOCALE][key] ?? key
      return interpolate(template, vars)
    }
  }, [locale])

  const value = useMemo(() => ({ locale, t, setLocale }), [locale, t, setLocale])

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n() {
  const ctx = useContext(I18nContext)
  if (!ctx) throw new Error("useI18n must be used within I18nProvider")
  return ctx
}

export function useT() {
  return useI18n().t
}

