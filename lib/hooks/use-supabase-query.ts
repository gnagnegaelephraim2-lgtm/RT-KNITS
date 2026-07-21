"use client"

import useSWR, { type SWRConfiguration } from "swr"
import type { SupabaseClient } from "@supabase/supabase-js"
import { getSupabaseBrowser } from "@/lib/supabase/client"

export class NotConfiguredError extends Error {
  constructor() {
    super("Supabase is not configured")
    this.name = "NotConfiguredError"
  }
}

type QueryFn<T> = (sb: SupabaseClient) => PromiseLike<{ data: T | null; error: { message: string } | null }>

/**
 * Runs a Supabase read via SWR. Distinguishes a "not configured" state
 * (missing env vars) from a genuine error so the UI can render the right thing.
 */
export function useSupabaseQuery<T>(key: string | null, query: QueryFn<T>, config?: SWRConfiguration) {
  const { data, error, isLoading, mutate, isValidating } = useSWR<T, Error>(
    key,
    async () => {
      const sb = getSupabaseBrowser()
      if (!sb) throw new NotConfiguredError()
      const { data, error } = await query(sb)
      if (error) throw new Error(error.message)
      return (data ?? ([] as unknown)) as T
    },
    config,
  )

  const notConfigured = error instanceof NotConfiguredError
  return {
    data,
    error: notConfigured ? undefined : error,
    notConfigured,
    isLoading,
    isValidating,
    mutate,
  }
}
