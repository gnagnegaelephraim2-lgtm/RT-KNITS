"use client"

import { useMemo } from "react"
import { useSupabaseQuery } from "@/lib/hooks/use-supabase-query"
import type { Asset, AppUser, Technician, Department } from "@/lib/types"

/** Loads reference tables once and exposes id→record maps for resolving FKs. */
export function useLookups() {
  const assets = useSupabaseQuery<Asset[]>("lookup:assets", (sb) =>
    sb.from("asset").select("asset_id, asset_code, name, status, location, required_trade"),
  )
  const users = useSupabaseQuery<AppUser[]>("lookup:users", (sb) =>
    sb.from("app_user").select("user_id, full_name, role, phone_number, department_id"),
  )
  const technicians = useSupabaseQuery<Technician[]>("lookup:technicians", (sb) =>
    sb.from("technician").select("technician_id, user_id, full_name, trade, active"),
  )
  const departments = useSupabaseQuery<Department[]>("lookup:departments", (sb) =>
    sb.from("department").select("department_id, name"),
  )

  const assetMap = useMemo(() => {
    const m = new Map<string, Asset>()
    ;(assets.data ?? []).forEach((a) => m.set(a.asset_id, a))
    return m
  }, [assets.data])

  const userMap = useMemo(() => {
    const m = new Map<string, AppUser>()
    ;(users.data ?? []).forEach((u) => m.set(u.user_id, u))
    return m
  }, [users.data])

  const techMap = useMemo(() => {
    const m = new Map<string, Technician>()
    ;(technicians.data ?? []).forEach((t) => m.set(t.technician_id, t))
    return m
  }, [technicians.data])

  const deptMap = useMemo(() => {
    const m = new Map<string, Department>()
    ;(departments.data ?? []).forEach((d) => m.set(d.department_id, d))
    return m
  }, [departments.data])

  return {
    assetMap,
    userMap,
    techMap,
    deptMap,
    notConfigured: assets.notConfigured,
    isLoading: assets.isLoading || users.isLoading || technicians.isLoading,
    assets: assets.data ?? [],
    users: users.data ?? [],
    technicians: technicians.data ?? [],
    departments: departments.data ?? [],
  }
}
