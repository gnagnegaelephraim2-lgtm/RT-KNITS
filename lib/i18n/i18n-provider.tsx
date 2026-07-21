"use client"

import { createContext, useContext, useMemo } from "react"
import { useAuth } from "@/components/auth/auth-provider"
import { DEFAULT_LOCALE, DICTIONARIES, type Locale } from "./dictionaries"

type Vars = Record<string, string | number>

interface I18nContextValue {
  locale: Locale
  t: (key: string, vars?: Vars) => string
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
  const { user } = useAuth()
  const locale: Locale = isSupportedLocale(user?.preferred_language) ? user.preferred_language : DEFAULT_LOCALE

  const t = useMemo(() => {
    return (key: string, vars?: Vars) => {
      // Plural key convention: pass vars.count and a "<key>_plural" entry to select it.
      const pluralKey = vars && typeof vars.count === "number" && vars.count !== 1 ? `${key}_plural` : key
      const dict = DICTIONARIES[locale]
      const template = dict[pluralKey] ?? dict[key] ?? DICTIONARIES[DEFAULT_LOCALE][key] ?? key
      return interpolate(template, vars)
    }
  }, [locale])

  const value = useMemo(() => ({ locale, t }), [locale, t])

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
