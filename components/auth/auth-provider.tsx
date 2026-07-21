"use client"

import { createContext, useCallback, useContext, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import type { Role, SessionUser } from "@/lib/types"

const STORAGE_KEY = "nita_session"
// Shared factory-device environment: keep sessions reasonably short.
const SESSION_TTL_MS = 8 * 60 * 60 * 1000 // 8 hours

interface StoredSession {
  user: SessionUser
  loginAt: number
}

interface AuthContextValue {
  user: SessionUser | null
  loading: boolean
  login: (user: SessionUser) => void
  logout: () => void
  updateUser: (patch: Partial<SessionUser>) => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

function readSession(): SessionUser | null {
  if (typeof window === "undefined") return null
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as StoredSession
    if (!parsed?.user || !parsed.loginAt) return null
    if (Date.now() - parsed.loginAt > SESSION_TTL_MS) {
      window.localStorage.removeItem(STORAGE_KEY)
      return null
    }
    return parsed.user
  } catch {
    return null
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    setUser(readSession())
    setLoading(false)
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) setUser(readSession())
    }
    window.addEventListener("storage", onStorage)
    return () => window.removeEventListener("storage", onStorage)
  }, [])

  const login = useCallback((u: SessionUser) => {
    const payload: StoredSession = { user: u, loginAt: Date.now() }
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
    document.cookie = `nita_role=${u.role}; path=/; max-age=${SESSION_TTL_MS / 1000}; samesite=lax`
    setUser(u)
  }, [])

  const logout = useCallback(() => {
    window.localStorage.removeItem(STORAGE_KEY)
    document.cookie = "nita_role=; path=/; max-age=0"
    setUser(null)
    router.push("/")
  }, [router])

  // Patches the in-memory + stored session (e.g. after a profile edit) without
  // resetting loginAt, so it doesn't silently extend the session TTL.
  const updateUser = useCallback((patch: Partial<SessionUser>) => {
    setUser((prev) => {
      if (!prev) return prev
      const next = { ...prev, ...patch }
      const raw = window.localStorage.getItem(STORAGE_KEY)
      const loginAt = raw ? (JSON.parse(raw) as StoredSession).loginAt : Date.now()
      const payload: StoredSession = { user: next, loginAt }
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
      return next
    })
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, updateUser }}>{children}</AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used within AuthProvider")
  return ctx
}

/** Client-side route guard used inside portal layouts. */
export function useRequireRole(role: Role) {
  const { user, loading } = useAuth()
  const router = useRouter()
  useEffect(() => {
    if (loading) return
    if (!user) {
      router.replace("/")
    } else if (user.role !== role) {
      router.replace(`/${user.role}`)
    }
  }, [user, loading, role, router])
  return { user, loading }
}
